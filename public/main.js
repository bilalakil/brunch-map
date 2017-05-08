document.addEventListener('DOMContentLoaded', (e) => {
  const auth = firebase.auth(),
        googleAuth = new firebase.auth.GoogleAuthProvider(),
        db = firebase.database()

  let spotRef = null

  const app = new Vue({
    el: '#app',
    data() {
      return {
        brunchSpots: {},

        brunchSpotForm: {
          name: '',
          address: '',
        },

        user: null,
      }
    },

    methods: {
      createBrunchSpot(e) {
        const ref = db.ref('users/' + this.user.uid + '/brunchSpots').push()
        ref.set({
          name: this.brunchSpotForm.name,
          address: this.brunchSpotForm.address
        })

        this.brunchSpotForm.name = ''
        this.brunchSpotForm.address = ''
      },
      deleteBrunchSpot(id) {
        db.ref('users/' + this.user.uid + '/brunchSpots/' + id).remove()
      },

      addBrunchSpot(snapshot) { Vue.set(this.brunchSpots, snapshot.key, snapshot.val()) },
      removeBrunchSpot(snapshot) { Vue.delete(this.brunchSpots, snapshot.key) },

      authGoogle() {
        const self = this

        auth.signInWithPopup(
          googleAuth
        )
      },
      unauth() {
        auth.signOut()
      },
    },

    watch: {
      user() {
        const self = this

        if(self.user) {
          spotRef = db.ref('users/' + this.user.uid + '/brunchSpots')
          spotRef.once('value', function(snap) {
            snap.forEach(child => self.addBrunchSpot)
          })
          spotRef.on('child_added', self.addBrunchSpot)
          spotRef.on('child_changed', self.addBrunchSpot)
          spotRef.on('child_removed', self.removeBrunchSpot)
        } else {
          self.brunchSpots = {}

          if(spotRef) {
            spotRef.off()
            spotRef = null
          }
        }
      }
    }
  })

  auth.onAuthStateChanged((user) => {
    app.user = user
  })

  document.getElementById('app').style.display = null
})
