import type { OpenMCAPI } from '../shared/types';
import { mockAPI } from './mock';

declare global {
  interface Window {
    openmc?: OpenMCAPI;
  }
}

export const api: OpenMCAPI = window.openmc ?? mockAPI;
