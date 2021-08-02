properties([
        disableConcurrentBuilds(),
        parameters([
                string(description: 'The branch to build', name: 'BRANCH', defaultValue: 'master'),
                booleanParam(description: 'Use Testingbot', name: 'TESTING_BOT', defaultValue: false)
        ]),
        pipelineTriggers([[$class: 'GitLabPushTrigger', triggerOnPush: true, ciSkip: true, branchFilterType: 'All']])
])

node {
    nodejs('node16') {
        try {
            //$BRANCH is taken from the gilab hook plugin
            def tagExists = !sh(returnStdout: true, script: "docker images -q docker.baqend.com/baqend/orestes:${env.BRANCH_NAME}").trim().isEmpty()
            def tag = tagExists ? BRANCH_NAME : 'master'

            currentBuild.displayName = "Git: ${env.BRANCH_NAME}, Docker: $tag"

            def browsers = 'Chrome-Docker';

            def useTestingBot = TESTING_BOT == 'true' || currentBuild.rawBuild.getCause(hudson.triggers.TimerTrigger.TimerTriggerCause) != null

            if (useTestingBot) {
                currentBuild.displayName += '(All Browsers)'
                browsers = 'bs_chrome_win,bs_ie_win,bs_edge_win,bs_firefox_win,bs_safari_mac'
            }

            stage('Checkout') {
                checkout scm
                sh "git clean -d -x -f"
            }

            stage('Install') {
                sh "npm ci"
                sh "npm install --silent websocket"
            }

            stage('Verify') {
                try {
                    sh "npm run lint"
                } catch (e) {
                    currentBuild.result = "UNSTABLE"
                }
            }

            stage('Build') {
                sh "npm run dist"
                sh "npm run test:build"
            }

            stage('Test') {
                configFileProvider([
                        configFile(fileId: '374518ba-f391-4dbe-8d58-d3fba55a4295', targetLocation: 'conf/log4j2.xml'),
                        configFile(fileId: 'org.jenkinsci.plugins.configfiles.json.JsonConfig1405948384992', targetLocation: 'conf/config.json'),
                        configFile(fileId: 'org.jenkinsci.plugins.configfiles.custom.CustomConfig1407677385363', targetLocation: 'spec')
                ]) {
                    sh "cp ~/baqend.jks $workspace/conf/"
                    sh "chmod o+rx -R $workspace/conf/"
                    def mongo, redis, orestes, node;
                    try {
                        mongo = sh(returnStdout: true, script: "docker run -d mongo:4.0.5 --storageEngine wiredTiger").trim()
                        redis = sh(returnStdout: true, script: "docker run -d redis:5.0.5").trim()
                        orestes = sh(returnStdout: true, script: "docker run -d -p 8143:8443 -v $workspace/conf:/opt/baqend/conf --link $mongo:mongo --link $redis:redis docker.baqend.com/baqend/orestes:$tag --config conf/config.json").trim()
                        node = sh(returnStdout: true, script: "docker run -d --restart=always --link $orestes:orestes docker.baqend.com/baqend/node:$tag").trim()

                        sleep 30
                        sh "docker logs $orestes"

                        withCredentials([
                            usernamePassword(credentialsId: 'browserstack_credentials', passwordVariable: 'BROWSER_STACK_ACCESS_KEY', usernameVariable: 'BROWSER_STACK_USERNAME')
                        ]) {
                            env.KARMA_HOST = 'bq3.baqend.com'

                            sh "npm run test:karma -- --single-run --browsers $browsers --reporters=junit || true"
                        }

                        nodejs(nodeJSInstallationName: '8.x') {
                            sh "npm run test:node || true"
                        }

                        nodejs(nodeJSInstallationName: '10.x') {
                            sh "npm run test:node || true"
                        }

                        nodejs(nodeJSInstallationName: '12.x') {
                            sh "npm run test:node || true"
                        }
                        nodejs(nodeJSInstallationName: '14.x') {
                            sh "npm run test:node || true"
                        }
                        nodejs(nodeJSInstallationName: '16.x') {
                            sh "npm run test:node || true"
                        }
                    } finally {
                        sh "docker logs $orestes"
                        sh "docker logs $node"

                        sh "docker stop $mongo $redis $orestes $node"
                        sh "docker rm -f $mongo $redis $orestes $node"
                    }
                }
            }

            stage('Report') {
                archiveArtifacts 'dist/**, index.d.ts'
                junit 'build/test-results/*.xml'
            }

            if (currentBuild.result == null)
                currentBuild.result = "SUCCESS"
        } catch (e) {
            currentBuild.result = "FAILED"
            throw e
        } finally {
            step([$class                  : 'Mailer',
                  notifyEveryUnstableBuild: true,
                  recipients              : emailextrecipients([
                          [$class: 'RequesterRecipientProvider']
                  ])
            ])
        }
    }

}
