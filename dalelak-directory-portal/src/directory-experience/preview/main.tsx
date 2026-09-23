import React from 'react';
import { createRoot } from 'react-dom/client';
import { DirectoryExperience } from '../DirectoryExperience';
import { DEMO_CATALOG } from './fixtures';
import '../design-system/preview.css';

createRoot(document.getElementById('directory-preview-root')!).render(<React.StrictMode><DirectoryExperience catalog={DEMO_CATALOG}/></React.StrictMode>);
import '../design-system/brand.css';
