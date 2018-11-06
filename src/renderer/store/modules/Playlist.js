
const state = {
  currentPlaying: '',
  PlayingList: [],
  FolderList: [],
};

const getters = {
  isFolderList: state => state.PlayingList.length === 0,
  nextVideo: (state, getters) => {
    const list = state.PlayingList.length > 0 ? state.PlayingList : state.FolderList;
    const index = list.findIndex(value => value === getters.originSrc);
    if (index !== -1 && index + 1 < list.length) {
      return list[index + 1];
    }
    return '';
  },
  playingList: (state, getters) => {
    if (getters.isFolderList) {
      return state.FolderList;
    }
    return state.PlayingList;
  },
};

const mutations = {
  PlayingList(state, t) {
    state.PlayingList = t;
  },
  AddPlayingList(state, t) {
    state.PlayingList.push(...t);
  },
  FolderList(state, t) {
    state.FolderList = t;
  },
  AddFolderList(state, t) {
    state.FolderList.push(...t);
  },
  currentPlaying(state, t) {
    state.currentPlaying = t;
  },
};

const actions = {
  currentPlaying({ commit }, t) {
    commit('currentPlaying', t);
  },
};

export default {
  state,
  mutations,
  actions,
  getters,
};
