import _ from 'lodash'
import moment from 'moment'
import { objectifyIDs, toObjectIDs } from '../db'
import { marshallTime, unmarshallTime } from '../marshall'
import { discard, disallow, getItems, replaceItems } from 'feathers-hooks-common'
import makeDebug from 'debug'

const debug = makeDebug('kalisio:kCore:model:hooks')

// Need to convert from server side types (moment dates) to basic JS types when "writing" to DB adapters
export function processTime (hook) {
  let items = getItems(hook)
  const isArray = Array.isArray(items)
  items = (isArray ? items : [items])
  items.forEach(item => marshallTime(item, 'time'))
  replaceItems(hook, isArray ? items : items[0])
  return hook
}

// Need to convert back to server side types (moment dates) from basic JS types when "reading" from DB adapters
export function unprocessTime (hook) {
  let items = getItems(hook)
  const isArray = Array.isArray(items)
  items = (isArray ? items : [items])
  items.forEach(item => unmarshallTime(item, 'time'))
  replaceItems(hook, isArray ? items : items[0])
  return hook
}

export function processPerspectives (hook) {
  let params = hook.params
  let query = params.query
  let service = hook.service

  // Test if some perspectives are defined on the model
  if (!service.options || !service.options.perspectives) return

  // Iterate through known perspectives of the model
  service.options.perspectives.forEach(perspective => {
    // Only discard if not explicitely asked by $select
    let filterPerspective = true
    if (!_.isNil(query) && !_.isNil(query.$select)) {
      // Transform to array to unify processing
      let selectedFields = (typeof query.$select === 'string' ? [query.$select] : query.$select)
      if (Array.isArray(selectedFields)) {
        selectedFields.forEach(field => {
          // Take care that we might only ask for a subset of perspective fields like ['perspective.fieldName']
          if ((field === perspective) || field.startsWith(perspective + '.')) {
            filterPerspective = false
          }
        })
      }
    }
    if (filterPerspective) {
      discard(perspective)(hook)
    }
  })
}

// When perspectives are present we disallow update in order to avoid erase them.
// Indeed when requesting an object they are not retrieved by default
export function preventUpdatePerspectives (hook) {
  let service = hook.service

  // Test if some perspectives are defined on the model
  if (!service.options || !service.options.perspectives) return

  disallow()(hook)
}

// The hook serialize allows to copy/move some properties within the objects holded by the hook
// It applies an array of rules defined by:
// - source: the path to the property to be copied
// - target: the path where to copy the property
// - delete: a flag to define whether the hook has to delete the source property
export function serialize (rules, options = {}) {
  return function (hook) {
    // Retrieve the items from the hook
    let items = getItems(hook)
    const isArray = Array.isArray(items)
    items = (isArray ? items : [items])
    // Apply the rules for each item
    items.forEach(item => {
      rules.forEach(rule => {
        const source = _.get(item, rule.source)
        if (!_.isNil(source)) {
          _.set(item, rule.target, source)
          if (rule.delete) {
            _.unset(item, rule.source)
          }
        } else if (options.throwOnNotFound || rule.throwOnNotFound) {
          throw new Error('Cannot find valid input value for property ' + rule.target)
        }
      })
    })
    // Replace the items within the hook
    replaceItems(hook, isArray ? items : items[0])
  }
}

// The hook objectify allows to transform the value bound to an '_id' like key as a string
// into a Mongo ObjectId on client queries
export function processObjectIDs (hook) {
  let items = getItems(hook)
  const isArray = Array.isArray(items)
  items = (isArray ? items : [items])
  items.forEach(item => objectifyIDs(item))
  replaceItems(hook, isArray ? items : items[0])

  if (hook.params.query) objectifyIDs(hook.params.query)

  return hook
}

// The hook convert allows to transform a set of input properties as a string
// into a Mongo ObjectId on client queries
export function convertObjectIDs (properties) {
  return function (hook) {
    let items = getItems(hook)
    const isArray = Array.isArray(items)
    items = (isArray ? items : [items])
    items.forEach(item => toObjectIDs(item, properties))
    replaceItems(hook, isArray ? items : items[0])

    if (hook.params.query) toObjectIDs(hook.params.query, properties)

    return hook
  }
}

// Utility function used to convert from string to Dates a fixed set of properties on a given object
export function toDates (object, properties, asMoment) {
  properties.forEach(property => {
    let date = _.get(object, property)
    if (date) {
      // We use moment to validate the date
      date = moment.utc(date)
      if (date.isValid()) {
        if (!asMoment) {
          date = date.toDate()
        }
        _.set(object, property, date)
      }
    }
  })
}

// The hook allows to transform a set of input properties as a string
// into a Date/Moment object on client queries
export function convertDates (properties, asMoment) {
  return function (hook) {
    let items = getItems(hook)
    const isArray = Array.isArray(items)
    items = (isArray ? items : [items])
    items.forEach(item => toDates(item, properties, asMoment))
    replaceItems(hook, isArray ? items : items[0])

    if (hook.params.query) toDates(hook.params.query, properties, asMoment)
    return hook
  }
}

export async function populatePreviousObject (hook) {
  if (hook.type !== 'before') {
    throw new Error(`The 'populatePreviousObject' hook should only be used as a 'before' hook.`)
  }
  let item = getItems(hook)
  let id = item._id || hook.id
  // Retrieve previous version of the item and make it available to next hooks
  if (id) {
    hook.params.previousItem = await hook.service.get(id.toString())
    debug('Populated previous object', hook.params.previousItem)
  }
  return hook
}

export function setAsDeleted (hook) {
  // Retrieve the items from the hook
  let items = getItems(hook)
  const isArray = Array.isArray(items)
  items = (isArray ? items : [items])
  // Apply the rules for each item
  items.forEach(item => _.set(item, 'deleted', true))
  // Replace the items within the hook
  replaceItems(hook, isArray ? items : items[0])
  return hook
}

export function setExpireAfter (delayInSeconds) {
  return function (hook) {
    if (hook.type !== 'before') {
      throw new Error(`The 'setExpireAfter' hook should only be used as a 'before' hook.`)
    }
    // Retrieve the items from the hook
    let items = getItems(hook)
    const isArray = Array.isArray(items)
    items = (isArray ? items : [items])
    // Apply the rules for each item
    let date = new Date(Date.now() + 1000 * delayInSeconds)
    items.forEach(item => _.set(item, 'expireAt', date))
    // Replace the items within the hook
    replaceItems(hook, isArray ? items : items[0])
    return hook
  }
}
