const functions = require('firebase-functions'),
      admin = require('firebase-admin'),

      maps = new (require('@googlemaps/google-maps-services-js').Client)({}),
      storage = new (require('@google-cloud/storage').Storage)()

const adminConfig = JSON.parse(process.env.FIREBASE_CONFIG)
admin.initializeApp(adminConfig)

const mapsParams = { key: functions.config().googlemaps.key }

exports.setLatLng =
  functions.database.ref('/users/{uid}/brunchSpots/{spot}/address')
    .onWrite((change, context) => {
      if(!change.after.exists()) return null

      const position = change.after.ref.parent.child('position'),
            errVal   = { lat: null, lng: null, error: true }

      return maps.geocode({
        params: {
          address: change.after.val(),
          ...mapsParams
        }
      })
        .then(
          response => {
            if(
              response.status !== 200 ||
              response.data.status !== 'OK'
            ) {
              if(
                response.status !== 200 ||
                response.data.status !== 'ZERO_RESULTS'
              ) {
                console.info('Geocode failed:', response)
              }

              return position.set(errVal)
            }

            return position.set({
              lat: response.data.results[0].geometry.location.lat,
              lng: response.data.results[0].geometry.location.lng,
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
    .onWrite((change, context) => {
      if(!change.before.exists()) return null

      const bucket = storage.bucket(adminConfig.storageBucket)
      const imageId = change.before.val()

      return bucket.file('users/' + context.params.uid + '/images/' + imageId.toString() + '/original').delete()
    })
