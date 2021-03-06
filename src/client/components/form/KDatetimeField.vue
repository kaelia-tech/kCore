<template>
  <div v-if="readOnly">
    {{ formattedDatetime }}
  </div>
  <q-field v-else
    :id="properties.name + '-field'"
    :error-message="errorLabel"
    :error="hasError"
    :disabled="disabled"
    @blur="onChanged"
    no-error-icon
    bottom-slots
    :prefix="formattedDatetime"
  >
    <template v-slot:prepend>
      <q-icon name="event" class="cursor-pointer">
        <q-popup-proxy transition-show="scale" transition-hide="scale">
          <q-date :value="localDatetime" @input="onChangeLocalDatetime" mask="YYYY-MM-DDTHH:mm:ss.SSSZ" v-bind="properties.field" />
        </q-popup-proxy>
      </q-icon>
      <q-icon name="access_time" class="cursor-pointer">
        <q-popup-proxy transition-show="scale" transition-hide="scale">
          <q-time :value="localDatetime" @input="onChangeLocalDatetime" mask="YYYY-MM-DDTHH:mm:ss.SSSZ" v-bind="properties.field" />
        </q-popup-proxy>
      </q-icon>
    </template>
    <!-- Helper -->
    <template v-if="helper" v-slot:hint>
      <span v-html="helper"></span>
    </template>
  </q-field>
</template>

<script>
import mixins from '../../mixins'
import moment from 'moment'
import _ from 'lodash'

export default {
  name: 'k-datetime-field',
  mixins: [mixins.baseField],
  data () {
    return {
      locale: _.get(this.properties.field, 'localeValue', this.$q.lang.getLocale())
    }
  },
  computed: {
    localDatetimeValue () {
      // get local (within the user's timezone) datetime value from the component model's UTC datetime
      return moment.utc(this.model).local()
    },
    localDatetime () {
      // get local datetime value, and format it using the same mask that's also used by the QDate and QTime components
      return this.localDatetimeValue.format('YYYY-MM-DDTHH:mm:ss.SSSZ')
    },
    formattedDatetime () {
      // get local datetime value, and format it using the current locale and the configured mask
      return this.localDatetimeValue.locale(this.locale).format(this.datetimeFormat)
    },
    datetimeFormat () {
      return _.get(this.properties.field, 'datetimeFormat', 'L LT')
    }
  },
  methods: {
    emptyModel () {
      let now = Date.now()
      // ADD given offset in seconds if any
      if (this.properties.field.defaultOffset) {
        now += this.properties.field.defaultOffset * 1000
      }
      return new Date(now).toISOString()
    },
    isEmpty () {
      // Can't actually be
      return false
    },
    onChangeLocalDatetime (datetime) {
      // Convert from date object to string
      this.model = moment.utc(datetime).toISOString()
      this.onChanged()
    }
  }
}
</script>
