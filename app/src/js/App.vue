<template>
  <div class="mdl-layout mdl-js-layout mdl-layout--fixed-header">
    <header class="mdl-layout__header">
      <div v-if="user" class="mdl-layout-icon"></div>
      <div class="mdl-layout__header-row">
        <span class="mdl-layout__title">Brunch Map</span>
        <div class="mdl-layout-spacer"></div>
        <nav class="mdl-navigation">
          <a
            v-if="user"
            class="mdl-navigation__link"
            href="#"
            @click="unauth"
          >Logout</a>
          <a
            v-else
            class="mdl-navigation__link"
            href="#"
            @click="authGoogle"
          >Login</a>
        </nav>
      </div>
    </header>
    <div class="mdl-layout__drawer">
      <nav v-if="user" class="mdl-navigation">
        <a
          v-for="(spot, id) in brunchSpots"
          class="mdl-navigation__link"
          href="#"
          @click="edit(id)"
        >{{ spot.name }} ({{ spot.address }})</a>
      </nav>
    </div>
    <main class="map-container mdl-layout__content">
      <gmap-map
        :center="{lat: 0, lng: 0}"
        :zoom="3"
        :options="{disableDefaultUI: true}"
        style="width: 100%; height: 100%;"
      >
        <template v-if="user">
          <gmap-marker
            v-for="(spot, id) in brunchSpots"
            v-if="spot.position && !spot.position.error"
            :position="spot.position"
          ></gmap-marker>
        </template>
      </gmap-map>
      <button
        v-if="user"
        v-mdl
        class="add
               mdl-button
               mdl-js-button
               mdl-button--fab
               mdl-button--colored
               mdl-js-ripple-effect"
        @click="dialog='edit'"
      ><i class="material-icons">add</i></button>
    </main>

    <dialog
      v-if="user && dialog === 'edit'"
      v-mdl
      v-dialog
      class="mdl-dialog"
    >
      <div class="mdl-dialog__content">
        <div v-mdl class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
          <input
            v-model="brunchSpotForm.name"
            class="mdl-textfield__input"
            type="text"
            id="brunch-spot-form-name"
          />
          <label
            class="mdl-textfield__label"
            for="brunch-spot-form-name"
          >Name</label>
        </div>
        <div v-mdl class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
          <input
            v-model="brunchSpotForm.address"
            class="mdl-textfield__input"
            type="text"
            id="brunch-spot-form-address"
          />
          <label
            class="mdl-textfield__label"
            for="brunch-spot-form-address"
          >Address</label>
        </div>
      </div>
      <div class="mdl-dialog__actions">
        <button
          v-mdl
          type="button"
          class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect"
          @click="dialog = null; saveBrunchSpot()"
        >
          {{ brunchSpotForm.id ? 'Save' : 'Add' }}
        </button>
        <button
          v-if="brunchSpotForm.id"
          type="button"
          class="mdl-button"
          @click="dialog = null; deleteBrunchSpot(brunchSpotForm.id)"
        >Delete</button>
        <button
          type="button"
          class="mdl-button"
          @click="dialog = null"
        >Close</button>
      </div>
    </dialog>
  </div>
</template>

<style lang="scss" scoped>
@import '../scss/variables';

.map-container {
  width: 100%;
  height: 100%;
}

.add {
  // Actually specified as 24px instead of a variable:
  // https://github.com/google/material-design-lite/blob/v1.3.0/src/layout/_layout.scss#L395
  $dist: $layout-header-desktop-indent + 24px;

  position: absolute;
  right: $dist;
  bottom: $dist;

  @media (max-width: $layout-screen-size-threshold) {
    $dist: $layout-header-mobile-indent * 2;

    right: $dist;
    bottom: $dist;
  }
}
</style>

<script>
import Vue from 'vue'
import * as dialogPolyfill from 'dialog-polyfill'

const auth = firebase.auth(),
      googleAuth = new firebase.auth.GoogleAuthProvider(),
      db = firebase.database()

let spotRef = null
let dialogEl = null

export default {
  data() {
    return {
      brunchSpots: {},

      brunchSpotForm: {
        id: '',
        name: '',
        address: '',
      },

      user: null,
      dialog: null,
    }
  },

  methods: {
    edit(id) {
      this.brunchSpotForm.id = id
      this.brunchSpotForm.name = this.brunchSpots[id].name
      this.brunchSpotForm.address = this.brunchSpots[id].address

      this.dialog = 'edit'
    },

    saveBrunchSpot(e) {
      const ref = this.brunchSpotForm.id
        ? db.ref('users/' + this.user.uid + '/brunchSpots/' + this.brunchSpotForm.id)
        : db.ref('users/' + this.user.uid + '/brunchSpots').push()

      ref.update({
        name: this.brunchSpotForm.name,
        address: this.brunchSpotForm.address,
      })

      this.brunchSpotForm.id = ''
      this.brunchSpotForm.name = ''
      this.brunchSpotForm.address = ''
    },
    deleteBrunchSpot(id) {
      db.ref('users/' + this.user.uid + '/brunchSpots/' + id).remove()

      if(id === this.brunchSpotForm.id) {
        this.brunchSpotForm.id = ''
        this.brunchSpotForm.name = ''
        this.brunchSpotForm.address = ''
      }
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

    window.addEventListener('load', () => {
      Vue.$gmapDefaultResizeBus.$emit('resize')
    })
  },

  directives: {
    'mdl': {
      bind(el) {
        componentHandler.upgradeElement(el)
      },
    },
    'dialog': {
      bind(el) {
        if(!el.showModal) {
          dialogPolyfill.registerDialog(el)
        }
      },
      inserted(el) {
        el.showModal()
      },
    },
  },
}
</script>
