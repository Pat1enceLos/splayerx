
export type RawPlaylistItem = {
  items: IDBValidKey[],
  hpaths: string[],
  lastOpened: number,
  playedIndex: number,
}
export type RawMediaItem = {
  quickHash: string,
  path: string,
  lastPlayedTime: number,
  duration: number,
  source: string,
}
export type PlaylistItem = {
  id: number,
  items: IDBValidKey[],
  hpaths: string[],
  lastOpened: number,
  playedIndex: number,
}
export type MediaItem = {
  videoId: number,
  quickHash: string,
  path: string,
  lastPlayedTime: number,
  duration: number,
  source: string,
}
export type SubtitleItem = {
  format: string,
  language: string,
  src: string,
  type: string,
}
export interface IDB {
  /**
   * @param  {string} database
   * @param  {string} objectStore
   * @param  {RawMediaItem|RawPlaylistItem} data
   * @returns {Promise<IDBValidKey>}
   * 向 database -> objectStore 中添加data，返回key值
   */
  add(objectStore: string, data: RawMediaItem | RawPlaylistItem): Promise<number>
  /**
   * @param  {string} database
   * @param  {string} objectStore
   * @param  {number} key
   * @param  {PlaylistItem|MediaItem} data
   * @returns {Promise<IDBValidKey>}
   * 向 database -> objectStore 中更新主键为key的数据，返回key值
   */
  update(objectStore: string, key: number, data: PlaylistItem | MediaItem): Promise<number>
  /**
   * @param  {string} database
   * @param  {string} objectStore
   * @param  {number} key
   * @returns {Promise<undefined>}
   * 删除 database -> objectStore 中主键为key的记录
   */
  delete(objectStore: string, key: number): Promise<undefined>
  /**
   * @param  {string} database
   * @param  {string} objectStore
   * @returns {Promise<undefined>}
   * 清除 database -> objectStore 中的所有记录
   */
  clear(objectStore: string): Promise<undefined>
  /**
   * @param  {string} database
   * @param  {string} objectStore
   * @param  {IDBKeyRange} keyRange
   * @returns {Promise<PlaylistItem[] | MediaItem[] | SubtitleItem[]>}
   * 返回 database -> objectStore 中所有记录
   */
  getAll(objectStore: string, keyRange: IDBKeyRange): Promise<PlaylistItem[] | MediaItem[] | SubtitleItem[]>
  /**
   * @param  {string} database
   * @param  {string} objectStore
   * @param  {number} key
   * @returns {Promise<PlaylistItem | MediaItem | SubtitleItem>}
   * 返回 database -> objectStore 中主键为key的记录
   */
  getValueByKey(objectStore: string, key: number): Promise<PlaylistItem | MediaItem | SubtitleItem | undefined>
  /**
   * @param  {string} database
   * @param  {string} objectStore
   * @param  {string} index
   * @param  {string|number} value
   * @returns {Promise<PlaylistItem | MediaItem | SubtitleItem>}
   * 返回 database -> objectStore 中属性index的值为value的第一条记录
   */
  getValueByIndex(objectStore: string, index: string, value: string | number): Promise<PlaylistItem | MediaItem | SubtitleItem | undefined>
  /**
   * @param  {string} database
   * @param  {string} objectStore
   * @param  {string} index
   * @param  {string|number} value
   * @returns {Promise<PlaylistItem[] | MediaItem[] | SubtitleItem[]>}
   * 返回 database -> objectStore 中属性index为value的所有记录
   */
  getAllValueByIndex(objectStore: string, index: string, value: string | number): Promise<PlaylistItem[] | MediaItem[] | SubtitleItem[]>
}