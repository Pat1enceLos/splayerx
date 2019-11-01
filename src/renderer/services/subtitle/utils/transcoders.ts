// @ts-ignore
import {
  toVttTime, toSrtTime, stringifyVtt, stringify,
  // @ts-ignore
} from 'subtitle';
import { SagiSubtitlePayload } from '../parsers';
import { Cue } from '@/interfaces/ISubtitle';

export function sagiSubtitleToWebVTT(subtitlePayload: SagiSubtitlePayload): string {
  const vttSubtitles = subtitlePayload
    .map(cue => ({
      start: toVttTime(cue.startTime * 1000),
      end: toVttTime(cue.endTime * 1000),
      text: cue.text
        .replace(/(\\h)/g, ' ')
        .replace(/(\\N)/g, '<br/>'),
    }));
  // use stringifyVtt to turn sagi into string
  return stringifyVtt(vttSubtitles);
}

export function sagiSubtitleToSRT(subtitlePayload: Cue[]): string {
  const srtSubtitles = subtitlePayload
    .map(cue => ({
      start: toSrtTime(cue.start * 1000),
      end: toSrtTime(cue.end * 1000),
      text: cue.text
        .replace(/(\\h)/g, ' ')
        .replace(/(\\N)/g, '<br/>'),
    }));
  // use stringifyVtt to turn sagi into string
  return stringify(srtSubtitles);
}
