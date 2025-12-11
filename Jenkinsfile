pipeline {
    agent any

    environment {
        PATH = "/usr/local/bin:${env.PATH}"
    }

    stages {
        stage('Stopping services') {
            steps {
                sh '''
                    docker compose -p hotel-paradise down || true
                '''
            }
        }

        stage('Deleting old images') {
            steps{
                sh '''
                    IMAGES=$(docker images --filter "label=com.docker.compose.project=hotel-paradise" -q)
                    if [ -n "$IMAGES" ]; then
                        docker rmi -f $IMAGES
                    fi
                '''
            }
        }

        stage('Pulling update') {
            steps {
                checkout scm
            }
        }

        stage('Building new images') {
            steps {
                sh '''
                    docker compose build --no-cache
                '''
            }
        }

        stage('Deploying containers') {
            steps {
                sh '''
                    docker compose up -d
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline executed successfully.'
        }

        failure {
            echo 'An error occurred during pipeline execution, check the logs of the stage for mor information.'
        }
    }
}
