var fs = require('fs');

var pattern = /([\w\.]*)\s*=\s*([\w\.]*)\s*\.\s*inherit\s*\(([\w\.\s,]*)\{/g;

var depends = {};
var classDeclaredIn = {};
var dependencyList = [];
var fileContent = {};
function walk(dir, done) {
	fs.readdir(dir, function(err, list) {
		var pending = list.length;

		if (!pending)
			return done();

		list.forEach(function(file) {
			file = dir + '/' + file;

			fs.stat(file, function(err, stat) {
				if (stat && stat.isDirectory()) {
					walk(file, function() {
						if (!--pending)
							done();
					});
				} else {
					dependency(file, function() {
						if (!--pending)
							done();
					});
				}
			});
		});
	});
};

function dependency(file, done) {
	if (file.indexOf(".js", this.length - 3) != -1) {
		fs.readFile(file, function(err, data) {
			if (file.indexOf("package.js", this.length - 10) != -1) {
				dependencyList.push(file);
			} else {
				var depend = [];
				while (pattern.exec(data)) {
					var className = RegExp.$1;
					var extending = RegExp.$2;
					var traitList = RegExp.$3;
					
					classDeclaredIn[className] = file;
					
					var traits = traitList.split(/\s*,\s*/);
					
					var definedIn = classDeclaredIn[extending];
					if (definedIn != file && depend.indexOf(extending) == -1)
						depend.push(extending);
					
					for (var i = 0, trait; trait = traits[i]; ++i) {	
						if (trait) {								
							definedIn = classDeclaredIn[trait];
							if (definedIn != file && depend.indexOf(trait) == -1)
								depend.push(trait);
						}
					}
					
					depends[file] = depend;
				}
			}
				
			fileContent[file] = data;
			
			done();
		});
	} else {
		done();
	}
}

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

function createDependencies(path, done) {
	walk(path, function() {
		for (var file in depends) {
			createDependency(file);
		}
		
		done();
	});
}

function merge(path, target) {
	createDependencies(path, function() {
		dependencyList.forEach(function(file, notFirst) {
			if (notFirst) {
				fs.appendFileSync(target, fileContent[file]);
			} else {
				fs.writeFileSync(target, fileContent[file]);
			}
		});
	});
}

merge(process.argv[2], process.argv[3]);
