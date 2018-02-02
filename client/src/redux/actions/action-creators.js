import {
    INCREMENT_COUNTER,
    DECREMENT_COUNTER,
    RESET_COUNTER
} from './types';

export const increment = makeActionCreator(INCREMENT_COUNTER);
export const decrement = makeActionCreator(DECREMENT_COUNTER);
export const reset = makeActionCreator(RESET_COUNTER);

/**
 * Generic function to generate action creators based on input arguments.
 * The first argument is always treated as the Redux action type; all other
 * arguments are treated as a property on the action object itself.
 *
 *   Example: const actionType = 'DO_IT';
 *            const actionCreator = makeActionCreator(actionType, 'data');
 *            actionCreator(123); --> { type: "DO_IT", data: 123 }
 */
export function makeActionCreator (type, ...keys) {
    if (!type) throw new Error('Type cannot be null/undefined');
    return function (...args) {
        let action = { type };
        keys.forEach((arg, index) => {
            action[keys[index]] = args[index];
        });
        return action;
    };
}
