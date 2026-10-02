import '@fontsource-variable/inter';
import '@fontsource-variable/space-grotesk';
import './style.css';

import { SolarSystemApp } from './core/SolarSystemApp.ts';
import { SidebarInspector } from './ui/SidebarInspector.ts';
import { HUD } from './ui/HUD.ts';
import { TimeControls } from './ui/TimeControls.ts';
import { AudioEngine } from './core/AudioEngine.ts';
import { TextureLoaderService } from './core/TextureLoaderService.ts';

function setupLoadingScreen() {
  const screen = document.getElementById('loading-screen');
  const fill = document.getElementById('loading-bar-fill');
  const percent = document.getElementById('loading-percent');
  let hidden = false;

  const hide = () => {
    if (hidden || !screen) return;
    hidden = true;
    if (fill) fill.style.width = '100%';
    if (percent) percent.textContent = '100%';
    // Let the first frames render before fading out
    setTimeout(() => {
      screen.classList.add('hidden-screen');
      setTimeout(() => screen.remove(), 1000);
    }, 250);
  };

  TextureLoaderService.manager.onProgress = (_url, loaded, total) => {
    const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
    if (fill) fill.style.width = `${pct}%`;
    if (percent) percent.textContent = `${pct}%`;
  };
  TextureLoaderService.manager.onLoad = hide;

  // Never trap the user behind the loading screen
  setTimeout(hide, 12000);
  return hide;
}

document.addEventListener('DOMContentLoaded', () => {
  const canvasContainer = document.getElementById('canvas-container')!;
  const hudContainer = document.getElementById('hud-container')!;
  const timeControlsContainer = document.getElementById('time-controls-container')!;
  const inspectorContainer = document.getElementById('inspector-container')!;

  const hideLoading = setupLoadingScreen();

  // 1. Initialize 3D Application
  const app = new SolarSystemApp(canvasContainer);

  // If no texture files were requested, the loading manager never reports completion
  if (TextureLoaderService.requested === 0) hideLoading();

  // Expose the app for debugging in dev builds only
  if (import.meta.env.DEV) {
    (window as unknown as { __app: SolarSystemApp }).__app = app;
  }

  // 2. Initialize Sidebar Inspector
  const sidebar = new SidebarInspector(inspectorContainer, id => {
    app.selectBody(id);
  }, () => app.clearSelection());

  // 3. Hook body selection to open sidebar
  app.onBodySelected = body => {
    sidebar.openBody(body);
  };

  // 4. Initialize Top HUD
  new HUD(hudContainer, app, sidebar);

  // 5. Initialize Bottom Time Controls
  new TimeControls(timeControlsContainer, app);

  // 6. User gesture initialization for Web Audio context
  const initAudioOnGesture = () => {
    AudioEngine.init();
    window.removeEventListener('pointerdown', initAudioOnGesture);
    window.removeEventListener('keydown', initAudioOnGesture);
  };
  window.addEventListener('pointerdown', initAudioOnGesture);
  window.addEventListener('keydown', initAudioOnGesture);

  console.log('Cosmos 3D Solar System Explorer initialized successfully.');
});
