import {SystemPlugin} from '../../DTCD-SDK/index';
import {version} from './../package.json';

export class NotificationSystem extends SystemPlugin {
  #guid;
  #config;

  /**
   * @constructor
   * @param {String} guid guid of system instance
   */
  constructor(guid) {
    super();
    this.#guid = guid;
    this.#config = {};
  }

  /**
   * Returns meta information about plugin for registration in application
   * @returns {Object} - meta-info
   */
  static getRegistrationMeta() {
    return {
      type: 'core',
      title: 'Система уведомлений',
      name: 'NotificationSystem',
      version,
      withDependencies: false,
      priority: 7,
    };
  }

  /**
   * Returns guid of NotificationSystem instance
   * @returns {String} - guid
   */
  get guid() {
    return this.#guid;
  }

  /**
   * @todo: development, description
   * Adds new warn level notification record to the system
   * @param {String} title - title
   * @param {String} body - message
   * @param {Object} config - config for notification
   * @return string - id notification
   */
  async create(title, body, config) {
    console.log('create', arguments)
    //...
    await this.createNativeNotification(title, body, config)

    // @todo: development
    return 'development';
  }

  async createNativeNotification(title, body, config) {
    console.log('createNotification', arguments)
    await this.requestPermission();
    const notification = new Notification(title, {
      body,
      ...config,
    });
    notification.onclick = function(e) {
      console.log('click on notification', e, this);
    };
    notification.onerror = function(e) {
      console.error('error notification', e, this);
    };
    /*notification.onclose = function(e) {
      console.log('close notification', e, this);
    };
    notification.onshow = function(e) {
      console.log('onshow notification', e, this);
    };*/

    return notification;
  }

  /**
   * @todo: development, description
   * @return Promise - has permission
   */
  requestPermission() {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support desktop notification');
    } else if (Notification.permission === 'granted') {
      return Promise.resolve(Notification.permission);
    } else if (Notification.permission !== 'denied') {
      return Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          return Promise.resolve(permission);
        }
        return Promise.reject(permission);
      });
    }
  }
}
