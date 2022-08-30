import pluginMeta from './Plugin.Meta';
import { v4 as uuidv4 } from 'uuid';
import {
  SystemPlugin,
  LogSystemAdapter,
  EventSystemAdapter,
} from '../../DTCD-SDK/index';

export class Plugin extends SystemPlugin {
  #guid;
  #config;
  #list;
  #logSystem;
  #eventSystem;

  /**
   * @constructor
   * @param {String} guid guid of system instance
   */
  constructor(guid) {
    super();
    this.#guid = guid;
    this.#config = {};
    this.#list = new Map();
    this.#logSystem = new LogSystemAdapter('0.5.0', this.#guid, 'NotificationSystem');
    this.#eventSystem = new EventSystemAdapter('0.4.0', guid);
    this.#eventSystem.registerPluginInstance(this, [
      'newNotify',
      'removeNotify',
      'clearNotifyList',
    ]);
  }

  /**
   * Returns meta information about plugin for registration in application
   * @returns {Object} - meta-info
   */
  static getRegistrationMeta() {
    return pluginMeta;
  }

  /**
   * Adds new notification record to the system
   * @param {String} title - title
   * @param {String} body - message
   * @param {Object} options - options for notification
   * options properties {
   *   floatMode: Boolean,
   *   floatTime: Number, // show time in seconds
   *   type: String, // can use: info/success/warning/error
   *   action: function, // the function that will be called by clicking on the notification title
   *   tag: String, // use the tag to group notifications in OS
   * }
   * @return string - id notification
   */
  async create(title, body, options = {}) {
    options.id = typeof options.tag === 'string' ? `tag-${options.tag}` : uuidv4();
    this.#logSystem.debug(`creating notification id: ${options.id}`);
    const notifyData = {
      title,
      body,
      options,
    };
    this.#list.set(options.id, notifyData);
    this.#eventSystem.publishEvent('newNotify', notifyData);

    if (Plugin.isSupportNotificationApi() && Notification.permission !== 'denied') {
      this.#logSystem.debug(`Notification permission is: ${Notification.permission}, request permission`);
      await this.requestDesktopNotificationPermission();
    }

    if (document.hidden && Plugin.isSupportNotificationApi()) {
      this.#logSystem.debug('Documents is hidden, make desktop notification');
      await this.#createDesktopNotification(title, body, options);
    }

    return options.id;
  }

  /**
   * Remove notification from system by ID
   * @param {String} id - notification id
   */
  remove(id) {
    this.#logSystem.debug(`Remove notification id: ${id}`);
    this.#list.delete(id);
    this.#eventSystem.publishEvent('removeNotify', id);
  }

  /**
   * Create desktop notification
   * @param {{ title, body, options }} - notification props
   */
  sendDesktopNotification({ title, body, options }) {
    return this.#createDesktopNotification(title, body, options)
  }

  /**
   * Create desktop notification
   * @param {String} title - notification title
   * @param {String} body - notification message
   * @param {Object} options - notification options
   * @return Promise - notification
   */
  async #createDesktopNotification(title, body, options = {}) {
    const notification = new Notification(title, {
      body,
      ...options,
    });
    notification.onclick = function(e) {
      this.#logSystem.debug(`Click on desktop notification id: ${options.id}`);
      window.focus();
      if (typeof options.action == 'function') {
        options.action({ title, body, options });
      }
    };
    return notification;
  }

  /**
   * Request desktop notification permission
   */
  requestDesktopNotificationPermission() {
    if (!Plugin.isSupportNotificationApi) {
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

  /**
   * Check support notification API
   */
  static isSupportNotificationApi() {
    return ('Notification' in window);
  }

  /**
   * Get notification list
   */
  getList() {
    this.#logSystem.debug('Get notification list');
    return Array.from(this.#list, ([id, obj]) => (obj));
  }

  /**
   * Clear all notification in system
   */
  clearList() {
    this.#logSystem.debug('Clear notification list');
    this.#list.clear();
    this.#eventSystem.publishEvent('clearNotifyList');
  }

  /**
   * test float notification
   */
  testFloatNotification() {
    const types = ['info','success','warning','error'];
    this.create(
      '[Float] Test notification',
      [...Array(Math.floor(Math.random() * 50))].map(() => Math.random().toString(36).substring(2, 15)).join(' '),
      {
        floatMode: true,
        floatTime: 5,
        type: types[Math.floor(Math.random() * types.length)],
      }
    )
  }
}
