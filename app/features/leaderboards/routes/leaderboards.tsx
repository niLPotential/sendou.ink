import type {
  LinksFunction,
  LoaderArgs,
  SerializeFrom,
  V2_MetaFunction,
} from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { Avatar } from "~/components/Avatar";
import { Main } from "~/components/Main";
import { discordFullName, makeTitle } from "~/utils/strings";
import {
  LEADERBOARDS_PAGE,
  navIconUrl,
  teamPage,
  topSearchPlayerPage,
  userPage,
  userSubmittedImage,
} from "~/utils/urls";
import styles from "../../top-search/top-search.css";
import {
  userSPLeaderboard,
  type UserSPLeaderboardItem,
} from "../queries/userSPLeaderboard.server";
import type { SendouRouteHandle } from "~/utils/remix";
import {
  type TeamSPLeaderboardItem,
  teamSPLeaderboard,
} from "../queries/teamSPLeaderboard.server";
import React from "react";
import { LEADERBOARD_TYPES } from "../leaderboards-constants";
import { useTranslation } from "~/hooks/useTranslation";
import { i18next } from "~/modules/i18n";
import {
  type XPLeaderboardItem,
  allXPLeaderboard,
  modeXPLeaderboard,
  weaponXPLeaderboard,
} from "../queries/XPLeaderboard.server";
import { WeaponImage } from "~/components/Image";
import {
  weaponCategories,
  type MainWeaponId,
  type RankedModeShort,
} from "~/modules/in-game-lists";
import { rankedModesShort } from "~/modules/in-game-lists/modes";

export const handle: SendouRouteHandle = {
  i18n: ["vods"],
  breadcrumb: () => ({
    imgPath: navIconUrl("leaderboards"),
    href: LEADERBOARDS_PAGE,
    type: "IMAGE",
  }),
};

export const meta: V2_MetaFunction = (args) => {
  const data = args.data as SerializeFrom<typeof loader> | null;

  if (!data) return [];

  return [
    { title: data.title },
    {
      name: "description",
      content:
        "Leaderboards of top Splatoon players ranked by their X Power and tournament results",
    },
  ];
};

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: styles }];
};

const TYPE_SEARCH_PARAM_KEY = "type";

export const loader = async ({ request }: LoaderArgs) => {
  const t = await i18next.getFixedT(request);
  const unvalidatedType = new URL(request.url).searchParams.get(
    TYPE_SEARCH_PARAM_KEY
  );

  const type =
    LEADERBOARD_TYPES.find((type) => type === unvalidatedType) ??
    LEADERBOARD_TYPES[0];

  return {
    userLeaderboard: type === "USER" ? userSPLeaderboard() : null,
    teamLeaderboard: type === "TEAM" ? teamSPLeaderboard() : null,
    xpLeaderboard:
      type === "XP-ALL"
        ? allXPLeaderboard()
        : type.startsWith("XP-MODE")
        ? modeXPLeaderboard(type.split("-")[2] as RankedModeShort)
        : type.startsWith("XP-WEAPON")
        ? weaponXPLeaderboard(Number(type.split("-")[2]) as MainWeaponId)
        : null,
    title: makeTitle(t("pages.leaderboards")),
  };
};

export default function LeaderboardsPage() {
  const { t } = useTranslation(["common", "game-misc", "weapons"]);
  const [searchParams, setSearchParams] = useSearchParams();
  const data = useLoaderData<typeof loader>();

  return (
    <Main halfWidth className="stack lg">
      <select
        className="text-sm"
        value={searchParams.get(TYPE_SEARCH_PARAM_KEY) ?? LEADERBOARD_TYPES[0]}
        onChange={(e) =>
          setSearchParams({ [TYPE_SEARCH_PARAM_KEY]: e.target.value })
        }
      >
        <optgroup label="SP">
          {LEADERBOARD_TYPES.filter((type) => !type.includes("XP")).map(
            (type) => {
              return (
                <option key={type} value={type}>
                  {t(`common:leaderboard.type.${type as "USER" | "TEAM"}`)}
                </option>
              );
            }
          )}
        </optgroup>
        <optgroup label="XP">
          <option value="XP-ALL">{t(`common:leaderboard.type.XP-ALL`)}</option>
          {rankedModesShort.map((mode) => {
            return (
              <option key={mode} value={`XP-MODE-${mode}`}>
                {t(`game-misc:MODE_LONG_${mode}`)}
              </option>
            );
          })}
        </optgroup>
        {weaponCategories.map((category) => {
          return (
            <optgroup
              key={category.name}
              label={`XP (${t(`common:weapon.category.${category.name}`)})`}
            >
              {category.weaponIds.map((weaponId) => {
                return (
                  <option key={weaponId} value={`XP-WEAPON-${weaponId}`}>
                    {t(`weapons:MAIN_${weaponId}`)}
                  </option>
                );
              })}
            </optgroup>
          );
        })}
      </select>
      {data.userLeaderboard ? (
        <PlayersTable entries={data.userLeaderboard} />
      ) : null}
      {data.teamLeaderboard ? (
        <TeamTable entries={data.teamLeaderboard} />
      ) : null}
      {data.xpLeaderboard ? <XPTable entries={data.xpLeaderboard} /> : null}
    </Main>
  );
}

function PlayersTable({ entries }: { entries: UserSPLeaderboardItem[] }) {
  return (
    <div className="placements__table">
      {entries.map((entry) => {
        return (
          <Link
            to={userPage(entry)}
            key={entry.entryId}
            className="placements__table__row"
          >
            <div className="placements__table__inner-row">
              <div className="placements__table__rank">
                {entry.placementRank}
              </div>
              <div>
                <Avatar size="xxs" user={entry} />
              </div>
              <div>{discordFullName(entry)}</div>
              <div className="placements__table__power">{entry.power}</div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function TeamTable({ entries }: { entries: TeamSPLeaderboardItem[] }) {
  return (
    <div className="placements__table">
      {entries.map((entry) => {
        return (
          <div key={entry.entryId} className="placements__table__row">
            <div className="placements__table__inner-row">
              <div className="placements__table__rank">
                {entry.placementRank}
              </div>
              {entry.team?.avatarImgUrl ? (
                <Link
                  to={teamPage(entry.team.customUrl)}
                  title={entry.team.name}
                >
                  <Avatar
                    size="xxs"
                    url={userSubmittedImage(entry.team.avatarImgUrl)}
                    className="placements__avatar"
                  />
                </Link>
              ) : null}
              <div className="text-xs">
                {entry.members.map((member, i) => {
                  return (
                    <React.Fragment key={member.id}>
                      <Link to={userPage(member)}>{member.discordName}</Link>
                      {i !== entry.members.length - 1 ? ", " : null}
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="placements__table__power">{entry.power}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function XPTable({ entries }: { entries: XPLeaderboardItem[] }) {
  return (
    <div className="placements__table">
      {entries.map((entry) => {
        return (
          <Link
            to={topSearchPlayerPage(entry.playerId)}
            key={entry.entryId}
            className="placements__table__row"
          >
            <div className="placements__table__inner-row">
              <div className="placements__table__rank">
                {entry.placementRank}
              </div>
              {entry.discordId ? (
                <Avatar size="xxs" user={entry as any} />
              ) : null}
              <WeaponImage
                className="placements__table__weapon"
                variant="build"
                weaponSplId={entry.weaponSplId}
                width={32}
                height={32}
              />
              <div>{entry.name}</div>
              <div className="placements__table__power">{entry.power}</div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
