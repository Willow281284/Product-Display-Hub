import { CheckCircle2, XCircle, AlertCircle, Circle, PartyPopper } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AttributeValidation, SECTION_LABELS, AttributeSection } from '@/types/productAttribute';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface AttributeValidationChecklistProps {
  validations: AttributeValidation[];
  onAttributeClick?: (key: string) => void;
}

export function AttributeValidationChecklist({
  validations,
  onAttributeClick,
}: AttributeValidationChecklistProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [prevComplete, setPrevComplete] = useState(false);

  // Group by section
  const sections = validations.reduce((acc, v) => {
    const section = v.section as AttributeSection;
    if (!acc[section]) acc[section] = [];
    acc[section].push(v);
    return acc;
  }, {} as Record<AttributeSection, AttributeValidation[]>);

  const totalRequired = validations.filter(v => v.isRequired).length;
  const completedRequired = validations.filter(v => v.isRequired && v.isValid).length;
  const isComplete = totalRequired > 0 && completedRequired === totalRequired;
  const hasErrors = validations.some(v => v.isMissing);
  const completionPercent = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 100;

  // Trigger celebration when transitioning to complete
  useEffect(() => {
    if (isComplete && !prevComplete) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 2000);
      return () => clearTimeout(timer);
    }
    setPrevComplete(isComplete);
  }, [isComplete, prevComplete]);

  return (
    <div className="flex flex-col h-full">
      {/* Summary Header */}
      <div className={cn(
        "p-3 border-b transition-all duration-500",
        isComplete 
          ? "bg-green-50 dark:bg-green-950/30" 
          : "bg-muted/30",
        showCelebration && "animate-pulse"
      )}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            Validation Checklist
            {showCelebration && (
              <PartyPopper className="w-4 h-4 text-green-600 animate-bounce" />
            )}
          </h3>
          <Badge 
            variant={hasErrors ? 'destructive' : 'default'}
            className={cn(
              "transition-all duration-300",
              isComplete 
                ? "bg-green-500 text-white dark:bg-green-600 shadow-lg shadow-green-500/30" 
                : hasErrors 
                  ? '' 
                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            )}
          >
            {isComplete ? '✓ Complete!' : `${completionPercent}% Complete`}
          </Badge>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div 
            className={cn(
              "h-2 rounded-full transition-all duration-500",
              isComplete 
                ? "bg-gradient-to-r from-green-400 to-green-600 shadow-[0_0_10px_rgba(34,197,94,0.5)]" 
                : hasErrors 
                  ? "bg-destructive" 
                  : "bg-green-500"
            )}
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className={cn(
            "flex items-center gap-1 transition-colors duration-300",
            isComplete && "text-green-600 font-medium"
          )}>
            <CheckCircle2 className={cn(
              "w-3 h-3",
              isComplete ? "text-green-600" : "text-green-600"
            )} />
            {completedRequired} required complete
          </span>
          {hasErrors && (
            <span className="flex items-center gap-1 text-destructive">
              <XCircle className="w-3 h-3" />
              {totalRequired - completedRequired} missing
            </span>
          )}
        </div>

        {/* Celebration message */}
        {showCelebration && (
          <div className="mt-2 text-sm font-medium text-green-600 animate-fade-in flex items-center gap-2">
            <span className="inline-block animate-bounce">🎉</span>
            All required fields complete!
            <span className="inline-block animate-bounce" style={{ animationDelay: '0.1s' }}>🎉</span>
          </div>
        )}
      </div>

      {/* Sections */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-3">
          {(Object.keys(SECTION_LABELS) as AttributeSection[]).map(section => {
            const items = sections[section];
            if (!items || items.length === 0) return null;

            const sectionComplete = items.filter(v => v.isRequired).every(v => v.isValid);
            const sectionHasRequired = items.some(v => v.isRequired);

            return (
              <div key={section} className="space-y-1">
                <div className="flex items-center gap-2 px-2">
                  {sectionHasRequired ? (
                    sectionComplete ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                    )
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {SECTION_LABELS[section]}
                  </span>
                </div>
                
                <div className="space-y-0.5">
                  {items.map(item => (
                    <button
                      key={item.key}
                      onClick={() => onAttributeClick?.(item.key)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-all duration-300",
                        "hover:bg-muted/50",
                        item.isMissing && "bg-red-50 dark:bg-red-950/30",
                        !item.isValid && !item.isMissing && "bg-yellow-50 dark:bg-yellow-950/30",
                        item.isValid && "bg-green-50/50 dark:bg-green-950/20"
                      )}
                    >
                      <div className={cn(
                        "transition-all duration-300",
                        item.isValid && "animate-scale-in"
                      )}>
                        {item.isValid ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
                        ) : item.isMissing ? (
                          <XCircle className="w-4 h-4 shrink-0 text-red-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0 text-yellow-600" />
                        )}
                      </div>
                      <span className={cn(
                        "truncate flex-1 transition-colors duration-300",
                        item.isMissing && "text-destructive",
                        item.isValid && "text-green-700 dark:text-green-400"
                      )}>
                        {item.name}
                        {item.isRequired && <span className="text-destructive ml-1">*</span>}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
