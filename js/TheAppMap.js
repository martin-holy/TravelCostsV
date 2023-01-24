export default {
  props: {
    storesInGroups: { type: Array }
  },

  emits: ['storeSelected'],

  data () {
    return { }
  },

  template: `
    <div class="theAppMap">
      <img src="./img/background.jpg" alt="" />
      <div
        v-for="sig in storesInGroups"
        :key="sig.group.Id">
        <h2>{{ sig.group.name }}</h2>
        <div>
          <img :src="'./img/' + sig.group.icon + '.png'" />
          <ul>
            <li
              v-for="store in sig.stores"
              :key="store.Id"
              @click="$emit('storeSelected', 'store', store)">
              {{ store.schema.title }}
            </li>
          </ul>
        </div>
      </div>
    </div>`
}