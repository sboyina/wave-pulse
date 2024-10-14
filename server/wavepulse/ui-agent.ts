"use client";
import { Agent } from '@wavemaker/wavepulse-agent/src/agent';
import { Channel, WebSocketChannel } from '@wavemaker/wavepulse-agent/src/channel';
import { CALLS } from '@wavemaker/wavepulse-agent/src/constants';
import axios from 'axios';
import { Subject } from 'rxjs';

const WAVEPULSE_SESSION_DATA = 'wavepulse:session_data';

export class UIAgent extends Agent {

    private connectionSubject = new Subject();
    private _isConnected = false;
    private _sessionData = {} as any;
    private _currentSessionData = {} as any;
    private _sessionDataKey = '';

    constructor(private wsurl: string,
        private httpurl: string,
        private localStorage: Storage,
        sessionDataKey?: string) {
        sessionDataKey = sessionDataKey || localStorage.getItem(WAVEPULSE_SESSION_DATA) || '';
        super(sessionDataKey ? {
            send: () => {},
            setListener: () => {}
        } as Channel: WebSocketChannel.connect({
            url: wsurl
        }));
        if (sessionDataKey) {
            this.getSessionData(sessionDataKey).then(data => {
                this._sessionData = data;
            });
        } else {
            this.checkForWavePulseAgent();
        }
        this._sessionDataKey = sessionDataKey || '';
    }

    get sessionData() {
        return this._sessionData;
    }

    get currentSessionData() {
        return this._currentSessionData;
    }

    get sessionDataKey() {
        return this._sessionDataKey;
    }

    set sessionDataKey(k: string) {
        if (k) {
            this.localStorage.setItem(WAVEPULSE_SESSION_DATA, k);
        } else {
            this.localStorage.removeItem(WAVEPULSE_SESSION_DATA);
        }
        if (this.sessionDataKey !== k) {
            setTimeout(() => location.reload(), 100);
        }
    }

    private async checkForWavePulseAgent() {
        try {
            await this.invoke(CALLS.HANDSHAKE.WISH, [], {
                timeout: 2000
            });
            this._isConnected = true;
            this.connectionSubject.next(this.isConnected);
        } catch(e) {
            this.checkForWavePulseAgent();
        }
    }

    get isConnected() {
        return this._isConnected && !this.sessionDataKey;
    }

    public onConnect(callback : Function) {
        if (this.isConnected) {
            callback();
        }
        const destroy = this.connectionSubject.subscribe(() => {
            if(this.isConnected) {
                callback();
                destroy.unsubscribe();
            }
        });
    }

    public getWavepulseUrl(appId: string) {
        return axios.get(`${this.httpurl}/api/service/url?appId=${appId}`).then(res => res.data);
    }

    saveSessionData(name: string) {
        const form = new FormData();
        const dataToSave = {
            // timelineLogs : this.currentSessionData.timelineLogs
            ...this.currentSessionData
        };
        form.append('name', name);
        form.append('content', JSON.stringify(dataToSave));
        return axios.post(`${this.httpurl}/api/session/data`,form,  {
            headers: {
                'Content-Type': 'multipart/form'
            }
        });
    }

    getSessionData(id: string) {
        return axios.get(`${this.httpurl}/api/session/data/${id}`)
            .then((res) => (res.data || {}));
    }

    listSessionData() {
        return axios.get(`${this.httpurl}/api/session/data/list`).then(res => res.data);
    }
}