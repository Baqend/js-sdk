var glob = require("glob");
var fs = require('fs');
var path = require('path');

var pattern = /([\w\.]*)\s*=\s*([\w\.]*)\s*\.\s*inherit\s*\(([\w\.\s,]*)\{/g;

var depends = {};
var classDeclaredIn = {};
var dependencyList = [];
var fileContent = {};

module.exports = function(root) {
    var files = glob.sync(root + '/**/*.js');

    files.forEach(function(abspath) {
        var filename = abspath.substring(abspath.lastIndexOf('/') + 1);

        if (filename == "package.js") {
            dependencyList.push(abspath);
        } else {
            var data = fs.readFileSync(abspath);

            var depend = [];
            while (pattern.exec(data)) {
                var className = RegExp.$1;
                var extending = RegExp.$2;
                var traitList = RegExp.$3;

                classDeclaredIn[className] = abspath;

                var traits = traitList.split(/\s*,\s*/);

                var definedIn = classDeclaredIn[extending];
                if (definedIn != abspath && depend.indexOf(extending) == -1)
                    depend.push(extending);

                for (var i = 0, trait; trait = traits[i]; ++i) {
                    if (trait) {
                        definedIn = classDeclaredIn[trait];
                        if (definedIn != abspath && depend.indexOf(trait) == -1)
                            depend.push(trait);
                    }
                }

                depends[abspath] = depend;
            }
        }
    });

    for (var file in depends) {
        createDependency(file);
    }

    return dependencyList;
};

function createDependency(file) {
	if (dependencyList.indexOf(file) == -1) {
		var dependingClasses = depends[file];
		if (!dependingClasses) {
			throw new Error("Cycle dependency detected");
		} else {
			depends[file] = null;
		}
		
		for (var i = 0, dependingClass; dependingClass = dependingClasses[i]; i++) {
			var declaredIn = classDeclaredIn[dependingClass];
			if (declaredIn != null) {
				createDependency(declaredIn);
			}
		}
		
		if (dependencyList.indexOf(file) == -1) {				
			dependencyList.push(file);
		}
	}
}
