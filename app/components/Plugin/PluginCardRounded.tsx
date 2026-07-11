"use client";
import Link from "next/link";
import { Card, CardFooter, CardHeader, CardPreview, Text, makeStyles, tokens } from "@fluentui/react-components";
import * as React from "react";
import { StarFilled } from "@fluentui/react-icons";

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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "128px",
    minHeight: "128px",
    maxHeight: "128px",
    overflow: "hidden",
    flexShrink: 0,
  },
  blurBackground: {
    position: "absolute",
    inset: 0,
    backgroundBlendMode: "luminosity, overlay, normal",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center top",
    backgroundSize: "100% 128px",
    filter: "blur(22px) saturate(4) contrast(90%)",
    transform: "scale(1.5) translate3d(0, 0, 0)",
  },
  blurOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.12) 100%)",
  },
  blurMask: {
    position: "absolute",
    inset: 0,
    "::before": {
      position: "absolute",
      inset: 0,
      content: '""',
      background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.14) 100%)",
    },
  },
  icon: {
    position: "relative",
    zIndex: 1,
    width: "80px",
    height: "80px",
    minWidth: "80px",
    minHeight: "80px",
    maxWidth: "80px",
    maxHeight: "80px",
    objectFit: "contain",
    flexShrink: 0,
  },
  content: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start", // 确保内容整体从顶部开始堆叠
    height: "96px",
  },
  header: {
    flexGrow: 1,
    alignItems: "flex-start",     // 核心修改：覆盖 Fluent 默认居中，强制头部内容顶部对齐
    paddingBottom: tokens.spacingVerticalXS,
    paddingTop: tokens.spacingVerticalSNudge, // 微调内边距，使其贴合 Fluent 视觉格子
  },
  title: {
    lineHeight: "16px",           // 减小行高以适应 size 300 (14px)，防止多行时撑破容器
    overflow: "hidden",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 2,
    alignSelf: "flex-start",      // 确保文本节点自身顶部对齐
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

export default function PluginCardRounded({ plugin, showRating = false }: { plugin: any; showRating?: boolean }) {
  const styles = useStyles();
  const [iconSrc, setIconSrc] = React.useState<string>(`/api/plugins/${plugin.id}/resources/icon`);
  const author = plugin?.author || plugin?.owner_name || plugin?.owner_id || "作者未知";
  const ratingAverage = Number(plugin?.rating_average ?? 0);
  const ratingCount = Number(plugin?.rating_count ?? 0);
  const hasRating = ratingCount > 0;
  const previewBackgroundImage = `url(/images/noise.png), linear-gradient(transparent, transparent), url(${iconSrc})`;

  return (
    <Link href={`/plugins/${plugin.id}`} className={styles.link}>
      <Card appearance="filled" className={styles.card}>
        <CardPreview className={styles.preview}>
          <div className={styles.blurBackground} style={{ backgroundImage: previewBackgroundImage }} />
          <div className={styles.blurOverlay} />
          <div className={styles.blurMask} />
          <img
            src={iconSrc}
            alt={plugin.name}
            className={styles.icon}
            width={80}
            height={80}
            onError={() => setIconSrc("/images/default_plugin.png")}
          />
        </CardPreview>
        <div className={styles.content}>
          <CardHeader
            className={styles.header}
            // 使用 header slot，配合上面的 styles.header { alignItems: 'flex-start' } 实现完美的置顶排版
            header={<Text weight="semibold" size={300} className={styles.title}>{plugin.name}</Text>}
          />
          <CardFooter className={styles.footer}>
            <div className="flex items-center justify-between gap-2 w-full">
              <Text size={200} className={styles.author}>{author}</Text>
              {showRating && hasRating && (
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <Text size={200}>{ratingAverage.toFixed(1)}</Text>
                  <StarFilled fontSize={11} aria-hidden="true" />
                </div>
              )}
            </div>
          </CardFooter>
        </div>
      </Card>
    </Link>
  );
}
