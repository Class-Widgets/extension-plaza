"use client";
import { Button, Card, Text } from "@fluentui/react-components";

export default function Section({ title, moreHref, children }: { title: string; moreHref?: string; children: React.ReactNode }) {
  return (
    <Card appearance="filled" size="large">
      <div className="flex items-center justify-between">
        <Text weight="semibold" size={400}>{title}</Text>
        {moreHref ? (
          <Button as="a" href={moreHref} appearance="subtle" size="small">
            查看更多
          </Button>
        ) : null}
      </div>
      {children}
    </Card>
  );
}
