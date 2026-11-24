'use client';

import type { StageSlug } from '@/lib/production/stages';
import { AnthropometricEditor } from '@/components/production/AnthropometricEditor';
import { MaterialLibraryPage } from '@/components/production/MaterialLibraryPage';
import { ProductionStage } from '@/components/production/ProductionHub';
import { VirtualFittingRoom } from '@/components/production/VirtualFittingRoom';
import { FashionShowroom } from '@/components/production/FashionShowroom';
import { StudioWorkspace } from '@/components/studio/StudioWorkspace';

export function ProjectStageView({ stage }: { stage: StageSlug }) {
  switch (stage) {
    case 'measurements':
      return <AnthropometricEditor />;
    case 'design':
      return <StudioWorkspace />;
    case 'fabric':
      return <MaterialLibraryPage />;
    case 'cutting':
    case 'trims':
    case 'assembly':
    case 'finishing':
      return <ProductionStage stage={stage} />;
    case 'fitting':
      return <VirtualFittingRoom />;
    case 'showroom':
      return <FashionShowroom />;
  }
}
