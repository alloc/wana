/** For accessing the proxied state */
export const $$ = Symbol.for('wana:state')

/** For storing an `Observable` instance, and observing all events */
export const $O = Symbol.for('wana:observable')

/** For storing an observable proxy */
export const $P = Symbol.for('wana:proxy')

/** For observing "size" changes */
export const SIZE = Symbol.for('wana:size')
