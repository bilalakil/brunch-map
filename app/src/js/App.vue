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
            @mouseover="infoWindow = id"
            @mouseout="infoWindow = infoWindow === id ? null : infoWindow"
            @click="edit(id)"
          ></gmap-marker>
          <gmap-info-window
            v-if="_detail"
            :options="{ pixelOffset: { width: 0, height: -35 }, maxWidth: 200 }"
            :opened="_detail != null"
            :position="_detail.position"
            @closeclick="infoWindow = null"
          >
            <p>{{ _detail.name }}</p>
            <p v-if="imageIdToUrl(_detail.logo)">
              <img :src="imageIdToUrl(_detail.logo)" alt="" class="brunch-logo"/>
            </p>
          </gmap-info-window>
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
            @keyup.enter="saveBrunchSpot"
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
            @keyup.enter="saveBrunchSpot"
          />
          <label
            class="mdl-textfield__label"
            for="brunch-spot-form-address"
          >Address</label>
        </div>

        <p v-if="imageIdToUrl(brunchSpotForm.logo)">
          <img
            class="brunch-logo"
            :src="imageIdToUrl(brunchSpotForm.logo)"
            alt=""
          />
        </p>
        <input id="brunch-spot-form-logo-input" type="file" @change="logoSet"/>

        <div
          ref="logo-progress"
          v-mdl
          class="mdl-progress mdl-js-progress"
          :class="{ 'mdl-progress__indeterminate': this.logoUploader && this.logoProgress === 0 }"
        ></div>
        <template v-if="brunchSpotForm.logo === ''">
          <label
            for="brunch-spot-form-logo-input"
            class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored block-button"
          >
            Set logo
          </label>
        </template>
        <template v-else>
          <span
            class="mdl-button mdl-js-button mdl-button--raised block-button"
            @click="logoClear"
          >
            Clear logo
          </span>
        </template>
      </div>
      <div class="mdl-dialog__actions">
        <button
          v-mdl
          type="button"
          class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect"
          :disabled="logoUploader != null"
          @click="saveBrunchSpot"
        >
          {{ brunchSpotForm.id ? 'Save' : 'Add' }}
        </button>
        <button
          v-if="brunchSpotForm.id"
          type="button"
          class="mdl-button"
          @click="deleteBrunchSpot(brunchSpotForm.id)"
        >Delete</button>
        <button
          type="button"
          class="mdl-button"
          @click="resetEditForm"
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

.gm-style img {
  max-width: 100%;
  height: auto;
}

#brunch-spot-form-logo-input { display: none; }

.brunch-logo {
  max-width: $max-brunch-logo-width;
  max-height: $max-brunch-logo-height;
}

.block-button {
  display: block;
}
</style>

<script>
import Vue from 'vue'
import * as dialogPolyfill from 'dialog-polyfill'

const auth = firebase.auth(),
      googleAuth = new firebase.auth.GoogleAuthProvider(),
      storage = firebase.storage(),
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
        logo: '',
      },

      imageUrls: {},

      user: null,
      dialog: null,
      logoUploader: null,
      logoProgress: 0,
      infoWindow: null,
    }
  },

  computed: {
    _detail() {
      return this.infoWindow != null ? this.brunchSpots[this.infoWindow] : null
    },
  },

  methods: {
    edit(id) {
      this.brunchSpotForm.id = id
      this.brunchSpotForm.name = this.brunchSpots[id].name
      this.brunchSpotForm.address = this.brunchSpots[id].address
      this.brunchSpotForm.logo = this.brunchSpots[id].logo || ''

      this.dialog = 'edit'
    },
    resetEditForm() {
      this.dialog = null

      this.logoClear()

      this.brunchSpotForm.id = ''
      this.brunchSpotForm.name = ''
      this.brunchSpotForm.address = ''
    },

    logoSet(event) {
      const file = event.target.files[0]
      const imageId = +Date.now()

      this.brunchSpotForm.logo = file

      const sref = storage.ref('users/' + this.user.uid + '/images/' + imageId.toString() + '/original')
      this.logoUploader = sref.put(file)

      const progress = this.$refs['logo-progress']

      this.logoUploader.on(
        'state_changed',
        (snapshot) => {
          this.logoProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          progress.MaterialProgress.setProgress(this.logoProgress)
        },
        (error) => {
          this.brunchSpotForm.logo = ''
          this.stopLogoUploader()
        },
        () => {
          this.brunchSpotForm.logo = imageId
          this.stopLogoUploader()

          this.getImageUrl(imageId)
        }
      )
    },
    logoClear() {
      this.stopLogoUploader()
      
      if(
        typeof this.brunchSpotForm.logo === 'number' &&
        (
          this.brunchSpotForm.id
            ? this.brunchSpotForm.logo !== this.brunchSpots[this.brunchSpotForm.id].logo
            : true
        )
      ) {
        const sref = storage.ref('users/' + this.user.uid + '/images/' + this.brunchSpotForm.logo.toString() + '/original')
        sref.delete()
      }

      this.brunchSpotForm.logo = ''
    },
    stopLogoUploader() {
      if(!this.logoUploader) return

      this.logoUploader.cancel()
      this.logoUploader = null
      this.logoProgress = 0

      const progress = this.$refs['logo-progress']
      if(progress) progress.MaterialProgress.setProgress(0)
    },

    saveBrunchSpot(e) {
      if(this.logoUploader) return

      const ref = this.brunchSpotForm.id
        ? db.ref('users/' + this.user.uid + '/brunchSpots/' + this.brunchSpotForm.id)
        : db.ref('users/' + this.user.uid + '/brunchSpots').push()

      ref.update({
        name: this.brunchSpotForm.name,
        address: this.brunchSpotForm.address,
        logo: this.brunchSpotForm.logo || null
      })

      this.brunchSpotForm.logo = '' // So it won't be deleted in the reset
      this.resetEditForm()
    },
    deleteBrunchSpot(id) {
      if(id === this.brunchSpotForm.id) {
        this.resetEditForm()
      }

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

    imageIdToUrl(imageId) {
      if(typeof imageId !== 'number') return

      if(typeof this.imageUrls[imageId] === 'undefined') {
        this.getImageUrl(imageId)
      }

      return this.imageUrls[imageId]
    },
    getImageUrl(imageId) {
      Vue.set(this.imageUrls, imageId, false)

      const sref = storage.ref('users/' + this.user.uid + '/images/' + imageId.toString() + '/original')
      sref.getDownloadURL().then((url) => {
        this.imageUrls[imageId] = url
      })
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
