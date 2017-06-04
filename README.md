Brunch Map
==========

## Root: Firebase Deployment

    # Install dependencies
    yarn

    # Select project
    ./node_modules/.bin/firebase use staging

    # Deploy everything
    ./node_modules/.bin/firebase deploy

## `/app`: Frontend

- `$GOOGLE_MAPS_API_KEY`

__Requires the above environment variables to be set.__

    cd app

    # Install dependencies
    yarn

    # Build app
    ./node_modules/.bin/webpack --env.branch staging

    # Watch for changes
    ./node_modules/.bin/webpack --watch --env.branch staging

    # Firebase actions back in root..
    # Run local server
    ./node_modules/.bin/firebase serve

    # Deploy
    ./node_modules/.bin/firebase deploy --only hosting

## `/database.rules.json`: Database Rules

    # Deploy
    ./node_modules/.bin/firebase deploy --only database

## `/functions`: Cloud Functions

    cd functions

    # Install dependencies
    yarn

    # Firebase actions back in root..
    # Deploy
    ./node_modules/.bin/firebase deploy --only functions

## Continuous Integration via CircleCI

    # View config
    less .circleci/config.yml

    # Code, commit, push, debug, repeat
    # master and staging branches supported

