let rangeComputeMixin = {
  props: [
    'min',    // min value: time from
    'max',    // max value: time until
    'step',   // step (granularity): 'h' (hour) or 'm' (minute)
    'value',  // value: initial time
    'timeInterval',
    'timeFormatter'
  ],
  data () {
    return {
      currentValue: this.value,
      previousValue: null
    }
  },
  computed: {
    position: {
      get: function () {
        return this.calculatePosition(this.currentValue, this.min, this.max, this.componentWidth)
      },
      set: function (newPosition) {
        this.currentValue = this.calculateValue(newPosition, this.min, this.max, this.componentWidth)

        if (this.valueChanged(this.currentValue, this.previousValue, this.step)) {
          this.previousValue = this.currentValue

          this.$emit('change', this.currentValue)
        }
      }
    },
    timeIntervals () {
      let intervalValues = this.calculateIntervals(this.min, this.max, this.timeInterval)
      let timeIntervals = []

      // Push the time intervals; note that the number of intervals is one less than the number of values
      for (let i = 0, len = intervalValues.length - 1; i < len; i++) {
        const value = intervalValues[i]
        const nextValue = intervalValues[i + 1]

        timeIntervals.push(
            this.getTimeInterval(value, nextValue,
              this.min, this.max, this.componentWidth,
              i === 0, i === len - 1
            )
        )
      }

      return timeIntervals
    }
  },
  methods: {
    calculatePosition (value, rangeStart, rangeEnd, componentWidth) {
      return Math.round(componentWidth * (value - rangeStart) / (rangeEnd - rangeStart))
    },
    calculateValue (position, rangeStart, rangeEnd, componentWidth) {
      return Math.round(rangeStart + position / componentWidth * (rangeEnd - rangeStart))
    },
    calculateIntervals(rangeStart, rangeEnd, timeInterval) {
      let intervals = []
      let value = timeInterval.getIntervalStartValue(rangeStart)

      while (value <= rangeEnd + timeInterval.length) {
        intervals.push(value)
        value += timeInterval.length
      }

      return intervals
    },
    getTimeInterval (value, nextValue, rangeStart, rangeEnd, componentWidth, isFirstValue, isLastValue) {

      return {
        value,
        nextValue,
        position: this.calculatePosition(value, rangeStart, rangeEnd, componentWidth),
        nextPosition: this.calculatePosition(nextValue, rangeStart, rangeEnd, componentWidth),
        isFirstValue,
        isLastValue,
        displayFirstTick: value > rangeStart,
        displayNextTick: isLastValue && nextValue < rangeEnd
      }
    },
    valueChanged (value, previousValue, step) {
      let changed = true

      if (step !== null) {
        changed = false

        if (previousValue === null) {
          changed = true

        } else {
          const difference = Math.abs(value - previousValue)

          switch (step) {
            case 'h':
              changed = (difference >= 60 * 60000)
              break
            case 'm':
              changed = (difference >= 60000)   
              break
            default:
              changed = true
          }
        }
      }

      return changed
    }
  }
}

export default rangeComputeMixin
