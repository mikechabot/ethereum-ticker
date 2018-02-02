import { INITIAL_STATE } from '../../common/app-const';
import {
    INCREMENT_COUNTER,
    DECREMENT_COUNTER,
    RESET_COUNTER
} from '../actions/types';

const counter = (state = INITIAL_STATE.counter, action) => {
    switch (action.type) {
        case INCREMENT_COUNTER: {
            return state + 1;
        }
        case DECREMENT_COUNTER: {
            return state - 1;
        }
        case RESET_COUNTER: {
            return INITIAL_STATE.counter;
        }
        default: {
            return state;
        }
    }
};

export default counter;
