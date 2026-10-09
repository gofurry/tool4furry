import type { Region } from '../config/region';
import type { LabMode } from './routes';
import { messages } from './messages';
import ToolPageFrame from '../tools/ToolPageFrame';
import LabMenu from './LabMenu';
import CanvasDemo from './CanvasDemo';
import FormDemo from './FormDemo';
import BatchDemo from './BatchDemo';
import UILab from './UILab';
import FilesLab from './FilesLab';

export default function WorkbenchLab({
  mode,
  region,
}: {
  mode: LabMode;
  region: Region;
}) {
  const t = messages[region];
  return (
    <ToolPageFrame
      region={region}
      mode={mode === 'ui' || mode === 'files' ? 'custom' : mode}
      title={`DEMO · ${t[mode]}`}
      debug={<LabMenu mode={mode} t={t} />}
    >
      {mode === 'canvas' ? (
        <CanvasDemo t={t} header={null} />
      ) : mode === 'form' ? (
        <FormDemo t={t} header={null} />
      ) : mode === 'batch' ? (
        <BatchDemo t={t} header={null} />
      ) : mode === 'ui' ? (
        <UILab t={t} header={null} />
      ) : (
        <FilesLab t={t} header={null} />
      )}
    </ToolPageFrame>
  );
}
