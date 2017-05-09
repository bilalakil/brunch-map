<template>
  <div>
    <div v-if="user">
      <ul>
        <li v-for="(spot, id) in brunchSpots">
          {{ spot.name }} ({{ spot.address }})

          <button type="button" @click="deleteBrunchSpot(id)">Remove</button>
        </li>
      </ul>

      <form @submit.prevent="createBrunchSpot">
        <input type="text" v-model="brunchSpotForm.name"/>
        <input type="text" v-model="brunchSpotForm.address"/>

        <button type="submit">Add brunch spot</button>
      </form>
    </div>

    <div v-if="user">
      <button type="button" @click="unauth">
        Logout
      </button>
    </div>
    <div v-else>
      <button type="button" @click="authGoogle">
        Authenticate with Google
      </button>
    </div>
  </div>
</template>

<style lang="sass" scoped>
</style>

<script>
const auth = firebase.auth(),
      googleAuth = new firebase.auth.GoogleAuthProvider(),
      db = firebase.database()

let spotRef = null

export default {
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
  },

  created() {
    const self = this

    auth.onAuthStateChanged((user) => {
      self.user = user
    })
  },
}
</script>
