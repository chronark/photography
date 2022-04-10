import type {
  GetStaticPaths,
  GetStaticPathsResult,
  GetStaticProps,
  NextPage,
} from "next";
import Image from "next/image";

import {
  S3Client,
  ListObjectsCommand,
  ListObjectsCommandOutput,
} from "@aws-sdk/client-s3";

export type AlbumProps = {
  slug: string;
  images: string[];
};

const Album: NextPage<AlbumProps> = ({ slug, images }: AlbumProps) => {
  console.log({ images });
  return (
    <div>
      <span>{slug}</span>

      {images.map((src) => {
        console.log({ src });
        return (
          <Image key={src} src={src} width="720" height="720" alt="abc"></Image>
        );
      })}
    </div>
  );
};

export default Album;

export const getStaticPaths: GetStaticPaths = async () => {
  const s3 = new S3Client({
    region: "us-east-1",
    endpoint: process.env.S3_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
  });
  const buckets = await s3.send(
    new ListObjectsCommand({ Bucket: "annettewebersinke" })
  );

  const albums = (buckets.Contents ?? [])
    .filter((c) => c.Key?.endsWith("/"))
    .map((c) => c.Key?.replace(/\/$/, "")) as string[];

  const res = {
    paths: albums.map((slug) => {
      return {
        params: { slug },
      };
    }),
    fallback: false,
  };
  console.log(JSON.stringify({ res }, null, 2));
  return res;
};

function getImagesFromAlbum(
  buckets: ListObjectsCommandOutput,
  album: string
): string[] {
  const images = (buckets.Contents ?? []).filter(
    (b) => b.Key?.startsWith(album) && !b.Key?.endsWith("/")
  );

  return images.map(
    (image) =>
      `https://annettewebersinke.fra1.digitaloceanspaces.com/${image.Key}`
  );
}

export const getStaticProps: GetStaticProps<AlbumProps> = async (ctx) => {
  console.log("ctx: ", ctx.params);

  const s3 = new S3Client({
    region: "us-east-1",
    endpoint: process.env.S3_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
  });

  const buckets = await s3.send(
    new ListObjectsCommand({ Bucket: "annettewebersinke" })
  );

  const images = getImagesFromAlbum(buckets, ctx.params!.slug as string);
  console.log({ images });
  return {
    props: {
      slug: ctx.params?.slug as string,
      images,
    },
  };
};
