'use client';

import { JobPackTemplate } from '@/lib/data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TemplateSelectorProps {
  templates: JobPackTemplate[];
  selectedTemplate: JobPackTemplate | null;
  onSelectTemplate: (template: JobPackTemplate | null) => void;
  placeholder?: string;
}

export function TemplateSelector({
  templates,
  selectedTemplate,
  onSelectTemplate,
  placeholder = 'Choose a template...',
}: TemplateSelectorProps) {
  return (
    <Select
      value={selectedTemplate?.id || 'none'}
      onValueChange={(value) => {
        if (value === 'none') {
          onSelectTemplate(null);
        } else {
          const template = templates.find((t) => t.id === value);
          onSelectTemplate(template || null);
        }
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No Template</SelectItem>
        {templates.map((template) => (
          <SelectItem key={template.id} value={template.id}>
            <div className="flex flex-col">
              <span className="font-medium">{template.name}</span>
              {template.description && (
                <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                  {template.description}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
