import { createStore, applyMiddleware } from 'redux';
import logger from 'redux-logger';
import thunk from 'redux-thunk';
import rootReducer from '../reducers/root-reducer';

/**
 * Development Redux store
 * @param  {object} initialState    Initial state of the Redux store
 * @return {object}                 Redux store
 */
export default function configureStore (initialState) {
    return createStore(
        rootReducer,
        initialState,
        applyMiddleware(thunk, logger)
    );
}
