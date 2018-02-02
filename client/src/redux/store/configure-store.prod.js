import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from '../reducers/root-reducer';

/**
 * LOGGER IN PROD FOR DEMOS ONLY!
 * REMOVE THIS IMPORT AND THE MIDDLEWARE BEFORE GOING LIVE!
 */
import logger from 'redux-logger';

/**
 * Production Redux store
 * @param  {object} initialState    Initial state of the Redux store
 * @return {object}                 Redux store
 */
export default function configureStore (initialState) {
    return createStore(
        rootReducer,
        initialState,
        // applyMiddleware(thunk),          // USE ME FOR PROD!
        applyMiddleware(thunk, logger)      // DON'T USE ME FOR PROD!
    );
}
