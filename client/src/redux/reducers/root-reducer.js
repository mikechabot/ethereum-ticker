import { combineReducers } from 'redux';
import { entities } from 'redux-entity';
import counter from './counter';

export default combineReducers({
    entities,
    counter
});
