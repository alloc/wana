/** For accessing the proxied state */
export const $$ = Symbol.for('wana:state')

/** For storing observers and the observable proxy */
export const $O = Symbol.for('wana:observable')

/** For observing "size" changes */
export const SIZE = Symbol.for('wana:size')

/** For injecting custom proxy traps */
export const $T = Symbol.for('wana:traps')
