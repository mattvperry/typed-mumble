/// <reference path=".\typings\main\ambient\node\index.d.ts" />

interface MumbleStreamOptions {
    channels?: number;
    whisperId?: number;
    sampleRate?: number;
    gain?: number;
    bitDepth?: number;
    signed?: boolean;
    endianness?: string;
}

interface MessageRecipients {
    session?: number[];
    channel_id?: number[];
}

interface UserData {
    session: number;
    name: string;
    user_id: number;
    mute: boolean;
    deaf: boolean;
    suppress: boolean;
    self_mute: boolean;
    self_deaf: boolean;
    hash: string;
    recording: boolean;
    priority_speaker: boolean;
    channel_id?: number;
}

declare module "mumble" {
    import { Buffer } from "buffer";
    import { ConnectionOptions } from "tls";
    import { Duplex, ReadableOptions, WritableOptions, Readable, Writable } from "stream";
    import { EventEmitter } from "events";

    type ConnectCallback = (err: any, cli: MumbleClient) => void;

    class User extends EventEmitter {
        session: number;
        name: string;
        id: number;
        mute: boolean;
        deaf: boolean;
        suppress: boolean;
        selfMute: boolean;
        selfDeaf: boolean;
        hash: string;
        recording: boolean;
        prioritySpeaker: boolean;
        channel: Channel;

        constructor(data: UserData, client: MumbleClient);
        moveToChannel(channel: string|Channel): void;
        setSelfDeaf(isSelfDeaf: boolean): void;
        setSelfMute(isSelfMute: boolean): void;
        kick(reason?: string): void;
        ban(reason?: string): void;
        sendMessage(message: string): void;
        outputStream(noEmptyFrames: boolean): MumbleOutputStream;
        inputStream(): MumbleInputStream;
        canTalk(): boolean;
        canHear(): boolean;

        on(event: string, listener: Function): this;
        on(event: "mute", listener: (mute: boolean) => void): this;
        on(event: "self-mute", listener: (selfMute: boolean) => void): this;
        on(event: "self-deaf", listener:  (selfDeaf: boolean) => void): this;
        on(event: "suppress", listener: (status: boolean) => void): this;
        on(event: "recording", listener: (status: boolean) => void): this;
        on(event: "priority-speaker", listener: (status: boolean) => void): this;
        on(event: "disconnect", listener: () => void): this;
        on(event: "move", listener: (oldChannel: Channel, newChannel: Channel, actor: User) => void): this;
    }

    interface ChannelData {
        channel_id: number;
        name: string;
        links: { [k: string]: number };
        temporary: boolean;
        position: number;
        parent?: number;
    }

    class Channel extends EventEmitter {
        id: number;
        name: string;
        links: Channel[];
        temporary: boolean;
        position: number;
        parent: Channel;
        children: Channel[];
        users: User[];

        constructor(data: ChannelData, client: MumbleClient);
        join(): void;
        sendMessage(message: string): void;
        getPermissions(callback: Function): void;
        addSubChannel(name: string, options?: { temporary: boolean }): void;
        remove(): void;

        on(event: string, listener: Function): this;
        on(event: "permissions-update", listener: (permissions: any) => void): this;
        on(event: "links-add", listener: (newChannels: Channel[]) => void): this;
        on(event: "links-remove", listener: (channels: Channel[]) => void): this;
        on(event: "move", listener: (oldParent: Channel, newParent: Channel) => void): this;
        on(event: "remove", listener: () => void): this;
    }

    class MumbleInputStream extends Writable {
        constructor(connection: MumbleConnection, options: MumbleStreamOptions & WritableOptions);
        close(): void;
        setGain(gain: number): void;
    }

    class MumbleOutputStream extends Readable {
        constructor(connection: MumbleConnection, sessionId: number, options: { noEmptyFrames: boolean } & ReadableOptions);
        close(): void;
    }

    class MumbleClient extends EventEmitter {
        ready: boolean;
        connect: MumbleConnection;
        rootChannel: Channel;
        user: User;

        constructor(connection: MumbleConnection);

        authenticate(name: string, password?: string, tokens?: string[]): void;
        sendMessage(message: string, recipients: MessageRecipients): void;

        users(): User[];
        userById(id: number): User;
        userBySession(id: number): User;
        userByName(name: string): User;
        channelById(id: number): Channel;
        channelByName(name: string): Channel;
        channelByPath(path: string): Channel;

        outputStream(userid?: number): MumbleOutputStream;
        inputStream(options: MumbleStreamOptions): MumbleInputStream;
        inputStreamForUser(sessionId: number, options?: MumbleStreamOptions): MumbleInputStream;

        joinPath(path: string): void;
        sendVoice(chunk: Buffer): void;
        disconnect(): void;

        on(event: string, listener: Function): this;
        on(event: "message", listener: (message: string, user: User, scope: string) => void): this;
        on(event: "user-connect", listener: (user: User) => void): this;
        on(event: "user-mute", listener: (user: User, mute: boolean) => void): this;
        on(event: "user-self-mute", listener: (user: User, selfMute: boolean) => void): this;
        on(event: "user-self-deaf", listener:  (user: User, selfDeaf: boolean) => void): this;
        on(event: "user-suppress", listener: (user: User, status: boolean) => void): this;
        on(event: "user-recording", listener: (user: User, status: boolean) => void): this;
        on(event: "user-priority-speaker", listener: (user: User, status: boolean) => void): this;
        on(event: "user-disconnect", listener: (user: User) => void): this;
        on(event: "user-move", listener: (user: User, oldChannel: Channel, newChannel: Channel) => void): this;
        on(event: "channel-create", listener: (channel: Channel) => void): this;
        on(event: "channel-permissions-update", listener: (channel: Channel, permissions: any) => void): this;
        on(event: "channel-links-add", listener: (channel: Channel, newChannels: Channel[]) => void): this;
        on(event: "channel-links-remove", listener: (channel: Channel, channels: Channel[]) => void): this;
        on(event: "channel-move", listener: (channel: Channel, oldParent: Channel, newParent: Channel) => void): this;
        on(event: "channel-remove", listener: (channel: Channel) => void): this;
        on(event: "error", listener: (err: any) => void): this;
        on(event: "ready", listener: () => void): this;
        on(event: "disconnect", listener: () => void): this;
        on(event: "initialized", listener: (conn: MumbleConnection) => void): this;
        on(event: "permission-denied", listener: (data: any) => void): this;
        on(event: "voice-start", listener: (data: any) => void): this;
        on(event: "voice-end", listener: (data: any) => void): this;
        on(event: "voice", listener: (audio: any) => void): this;
    }

    export class MumbleConnection extends EventEmitter {
        constructor(socket: Duplex, options?: any);
        initialize(): void;
        setBitrate(bitrate: number): void;
        authenticate(name: string, password?: string, tokens?: string[]): void;
        sendMessage(type: string, data: { actor: number, message: string });
        outputStream(noEmtpyFrames: boolean): MumbleOutputStream;
        outputStream(userSession: number, noEmptyFrames: boolean): MumbleOutputStream;
        inputStream(options: MumbleStreamOptions): MumbleInputStream;
        joinPath(path: string): void;
        sendVoice(chunk: Buffer, whisperTarget?: number): void;
        sendVoiceFrame(frame: Buffer, whisperTarget?: number, voiceSequence?: number): void;
        sendEncodedFrame(packet: Buffer|Buffer[], codec: number, whisperTarget?: number, voiceSequence?: number): void;
        disconnect(): void;

        on(event: string, listener: Function): this;
        on(event: "error", listener: (err: any) => void): this;
        on(event: "disconnect", listener: () => void): this;
        on(event: "initialized", listener: (conn: MumbleConnection) => void): this;
        on(event: "permission-denied", listener: (data: any) => void): this;
        on(event: "voice-start", listener: (data: any) => void): this;
        on(event: "voice-end", listener: (data: any) => void): this;
        on(event: "voice", listener: (audio: any) => void): this;
    }

    export class MumbleConnectionManager {
        constructor(url: string, options: ConnectionOptions);
        connect(done: ConnectCallback): void;
    }

    export function connect(url: string, callback: ConnectCallback): MumbleConnectionManager;
    export function connect(url: string, options: ConnectionOptions, callback: ConnectCallback): MumbleConnectionManager;
}