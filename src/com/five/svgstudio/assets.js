import { Body } from './body.js';
import { Action } from './action.js';

export class Assets {

    static keyListKey(assetType, parentAssetKey) {
        return `five-${assetType + (parentAssetKey ? `.${parentAssetKey}` : '')}-keys`;
    }
    static generateKey() {
        return Math.random().toString(36).substring(2, 15);
    }

    static storeKey(assetType, key, parentAssetKey) {
        const keyListKey = this.keyListKey(assetType, parentAssetKey);
        const keyList = window.localStorage.getItem(keyListKey)?.split(',') ?? [];
        if (!keyList.includes(key)) {
            keyList.push(key);
        } 
        window.localStorage.setItem(keyListKey, keyList.join(','));
    }

    static loadSavedModels() {
        return this.loadAssets('models');
    }
    static saveBody(body) {
        console.log('saving body with key', body.key);
        window.localStorage.setItem(body.key, JSON.stringify(body));
        this.storeKey('models', body.key);
    }
    static loadBody(key) {
        return Body.fromData(JSON.parse(window.localStorage.getItem(key)));
    }

    static loadActions(bodyKey) {
        return this.loadAssets('actions', bodyKey);
    }
    static loadAssets(assetTypeKey, assetKey) {
        const assets = [];
        const keyList = window.localStorage.getItem(this.keyListKey(assetTypeKey, assetKey));
        const parser = this.getParser(assetTypeKey);
        if (keyList) {
            keyList.split(',').forEach(key => {
                if (window.localStorage.getItem(key)){
                    assets.push(parser(JSON.parse(window.localStorage.getItem(key))));
                }else{
                    console.warn(`Asset with key ${key} not found in localStorage`);
                }
            });
        }
        return assets;
    }
    static loadAction(actionKey) {
        console.log('loading action with key', actionKey);
        return Action.fromData(JSON.parse(window.localStorage.getItem(actionKey)));
    }
    static saveAction(action, bodyKey) {
       console.log('saving action with key', action.key);
        window.localStorage.setItem(action.key, JSON.stringify(action));
        this.storeKey('actions', action.key, bodyKey);
    }
    static getParser(assetType) {
        switch (assetType) {
            case 'models':
                return Body.fromData;
            case 'actions':
                return Action.fromData;
        }
    }

}