Brunch Map
==========

The following Google APIs are utilised by this project and need to be enabled for it to work (not including the APIs that the Firebase CLI will handle automatically):

- Maps JavaScript API
- Maps Geocoding API
- Manually enable Firebase Storage
- Manually enable login services

## Root: Firebase Deployment

    # Install dependencies
    npm i

    # Select project
    npx firebase use staging

    # Deploy everything (Frontend would need to be built first)
    npx firebase deploy

## `/app`: Frontend

- `$GOOGLE_MAPS_API_KEY`

__Requires the above environment variables to be set.__

    cd app

    # Install dependencies
    npm i

    # Build app
    npx webpack --env branch=staging

    # Watch for changes
    npx webpack --watch --env branch=staging

    # Firebase actions back in root..
    cd ..

    # Run local server
    npx firebase serve

    # Deploy
    npx firebase deploy --only hosting

## `/database.rules.json`: Database Rules

    # Deploy
    npx firebase deploy --only database

## `/storage.rules`: Storage Rules

    # Deploy
    npx firebase deploy --only storage

## `/functions`: Cloud Functions

- `googlemaps.key`

__Requires the above config variables to be set, i.e. via
`npx firebase functions:config:set googlemaps.key=...`.__

    cd functions

    # Install dependencies
    npm i

    # Firebase actions back in root..
    cd ..

    # Running functions locally has not been successfully tested yet ;(

    # Deploy
    npx firebase deploy --only functions

## Continuous Integration via GitHub Actions

    # View config
    less .github/workflows/{main,staging}-build-deploy.yml

    # Code, commit, push, debug, repeat
    # main and staging branches supported

