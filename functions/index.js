const functions = require('firebase-functions'),
      admin = require('firebase-admin'),

      maps = require('@google/maps').createClient({
        key: functions.config().googlemaps.key,
        Promise: require('q').Promise,
      }),
      storage = require('@google-cloud/storage')()

admin.initializeApp(functions.config().firebase)

exports.setLatLng =
  functions.database.ref('/users/{uid}/brunchSpots/{spot}/address')
    .onWrite(event => {
      if(!event.data.exists()) return

      const position = event.data.ref.parent.child('position'),
            errVal   = { lat: null, lng: null, error: true }

      return maps.geocode({ address: event.data.val() })
        .asPromise()
        .then(
          response => {
            if(
              response.status !== 200 ||
              response.json.status !== 'OK'
            ) {
              if(
                response.status !== 200 ||
                response.json.status !== 'ZERO_RESULTS'
              ) {
                console.info('Geocode failed:', response)
              }

              return position.set(errVal)
            }

            return position.set({
              lat: response.json.results[0].geometry.location.lat,
              lng: response.json.results[0].geometry.location.lng,
              error: null,
            })
          },
          err => {
            console.error('Geocode error:', err)

            return position.set(errVal)
          }
        )
    })

exports.removeBrunchLogo =
  functions.database.ref('/users/{uid}/brunchSpots/{spot}/logo')
    .onWrite(event => {
      if(!event.data.previous.exists()) return

      const bucket = storage.bucket(functions.config().firebase.storageBucket)
      const imageId = event.data.previous.val()

      return bucket.file('users/' + event.params.uid + '/images/' + imageId.toString() + '/original').delete()
    })
