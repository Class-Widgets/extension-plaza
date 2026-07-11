"use client";
import Link from "next/link";
import { Card, CardFooter, CardHeader, CardPreview, Text, makeStyles, tokens } from "@fluentui/react-components";
import * as React from "react";

const useStyles = makeStyles({
  link: {
    display: "block",
    width: "146px",
    maxWidth: "146px",
    color: "inherit",
    textDecorationLine: "none",
  },
  card: {
    height: "224px",
    minWidth: "146px",
    maxWidth: "146px",
    overflow: "hidden",
  },
  preview: {
    position: "relative",
    display: "grid",
    placeItems: "center",
    height: "128px",
    overflow: "hidden",
    backgroundPosition: "center",
    backgroundSize: "cover",
    "::before": {
      position: "absolute",
      inset: "-18px",
      content: '""',
      backgroundImage: "inherit",
      backgroundPosition: "center",
      backgroundSize: "cover",
      filter: "blur(18px) saturate(1.15)",
      opacity: 0.36,
    },
  },
  icon: {
    position: "relative",
    width: "128px",
    height: "128px",
    objectFit: "contain",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    height: "96px",
  },
  header: {
    flexGrow: 1,
    paddingBottom: tokens.spacingVerticalXS,
  },
  title: {
    lineHeight: "20px",
    overflow: "hidden",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 2,
  },
  footer: {
    justifyContent: "flex-end",
    paddingTop: tokens.spacingVerticalXS,
    color: tokens.colorNeutralForeground3,
  },
  author: {
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});

export default function PluginCardRounded({ plugin }: { plugin: any }) {
  const styles = useStyles();
  const [iconSrc, setIconSrc] = React.useState<string>(`/api/plugins/${plugin.id}/resources/icon`);
  const author = plugin?.author || plugin?.owner_name || plugin?.owner_id || "作者未知";

  return (
    <Link href={`/plugins/${plugin.id}`} className={styles.link}>
      <Card appearance="filled" className={styles.card}>
        <CardPreview className={styles.preview} style={{ backgroundImage: `url(${iconSrc})` }}>
          <img
            src={iconSrc}
            alt={plugin.name}
            className={styles.icon}
            onError={() => setIconSrc("/images/default_plugin.png")}
          />
        </CardPreview>
        <div className={styles.content}>
          <CardHeader
            className={styles.header}
            header={<Text weight="semibold" size={300} className={styles.title}>{plugin.name}</Text>}
          />
          <CardFooter className={styles.footer}>
            <Text size={200} className={styles.author}>{author}</Text>
          </CardFooter>
        </div>
      </Card>
    </Link>
  );
}
