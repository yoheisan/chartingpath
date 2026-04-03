import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EDGE_ATLAS_PATTERNS } from "@/hooks/usePatternDetailStats";

interface Props {
  patternKey: string;
  patternName: string;
}

export const PatternLiveSetupsCTA = ({ patternKey, patternName }: Props) => {
  const { t } = useTranslation();
  const isInEdgeAtlas = EDGE_ATLAS_PATTERNS.includes(patternKey);

  return (
    <div className="flex flex-wrap gap-4 text-sm">
      <Link
        to={`/patterns/live?pattern=${patternKey}`}
        className="text-primary hover:underline flex items-center gap-1"
      >
        {t('patternLibrary.seeLiveSetups', 'See live {{name}} setups', { name: patternName })}
        <ArrowRight className="h-3 w-3" />
      </Link>
      {isInEdgeAtlas && (
        <Link
          to="/#edge-atlas"
          className="text-primary hover:underline flex items-center gap-1"
        >
          {t('patternLibrary.viewInEdgeAtlas', 'View in Edge Atlas')}
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
};
