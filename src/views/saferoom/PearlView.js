import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Accordion from "components/Accordion";
import { get } from "lodash";
import { formatUnits } from "@ethersproject/units";
import BigNumber from "bignumber.js";
import { useInterval } from "react-use";

import { Pearl3DView } from "components/pearl3DView";
import { Controls3DView } from "components/controls3DView";
import { renderNumber } from "utils/number";
import { formatMsToDuration } from "utils/time";
import { getPearlsMaxBoostTime } from "utils/getPearlsMaxBoostTime";
import { getMaxApr, getMaxRoi } from "utils/pearlStats";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt, faInfoCircle } from "@fortawesome/free-solid-svg-icons";

import { pearlGrade, pearlSize } from "./utils/pearlSizeAndGradeValues";
import ReactTooltip from "react-tooltip";

const RowStat = ({ label, value }) => (
  <div className="text-sm flex flex-row justify-between my-1">
    <div className="block">
      <p className="text-gray-500 font-semibold">{label}</p>
    </div>

    <div className="block">
      <p className="font-bold">{value}</p>
    </div>
  </div>
);

export default (props) => {
  const {
    dna,
    dnaDecoded,
    bonusRewards,
    gemPriceUSD,
    pearlDataValues,
    boostColor,
    boostShape,
    boostPeriodInSeconds,
    boostPeriodStart,
    onClickNext,
    onClickPrev,
  } = props;

  const [grade, setGrade] = useState(0);
  const [size, setSize] = useState(0);
  const [maxBoostIn, setMaxBoostIn] = useState(0);

  useInterval(() => {
    if (maxBoostIn > 0) {
      setMaxBoostIn(Math.max(maxBoostIn - 1000, 0));
    }
  }, 1000);

  const bonusRewardFormatted = Number(formatUnits(bonusRewards, 18)).toFixed(2);
  const maxGemYield = (
    <>
      {bonusRewardFormatted}
      &nbsp;($
      {renderNumber(+(gemPriceUSD * +bonusRewardFormatted), 2)})
    </>
  );

  const pearlPriceBN = new BigNumber(pearlDataValues.pearlPrice);
  const showApr = pearlPriceBN.gt(0);

  const maxApr = getMaxApr(pearlDataValues, maxBoostIn, bonusRewards);
  const maxRoi = getMaxRoi(pearlDataValues, bonusRewards);
  const maxAprRoiField = `${showApr ? maxRoi + "% / " + maxApr : "?% / ?"}%`;

  useEffect(() => {
    if (dnaDecoded.length) {
      const grade_ = pearlGrade(
        get(dnaDecoded, "lustre"),
        get(dnaDecoded, "surface"),
        get(dnaDecoded, "nacreQuality")
      );
      setGrade(grade_);

      const size_ = pearlSize(get(dnaDecoded, "size"));
      setSize(size_);
    }
  }, [dnaDecoded]);

  useEffect(() => {
    const calculatedMaxBoostIn = getPearlsMaxBoostTime({
      shape: dnaDecoded.shape,
      colour: dnaDecoded.color,
      currentBoostColour: boostColor,
      currentBoostShape: boostShape,
      period: boostPeriodInSeconds,
      startOfWeek: boostPeriodStart,
    });

    setMaxBoostIn(calculatedMaxBoostIn);
  }, [dnaDecoded, boostColor, boostShape, boostPeriodInSeconds, boostPeriodStart]);

  const accordionData = [
    {
      title: "Traits",
      description: (
        <div>
          <RowStat label="Shape" value={get(dnaDecoded, "shape")} />
          <RowStat label="Color" value={get(dnaDecoded, "color")} />
          <RowStat label="Overtone" value={get(dnaDecoded, "overtone")} />
          <RowStat label="Rarity" value={get(dnaDecoded, "rarity").toLowerCase()} />
        </div>
      ),
    },
    {
      title: "Grading",
      description: (
        <div>
          <RowStat label="Grade" value={grade} />
          <RowStat label="Surface" value={get(dnaDecoded, "surface")} />
          <RowStat label="Lustre" value={get(dnaDecoded, "lustre")} />
          <RowStat label="Nacre Quality" value={get(dnaDecoded, "nacreQuality")} />
        </div>
      ),
    },
    {
      title: "Size",
      description: (
        <div>
          <RowStat label="Size" value={size} />
          <RowStat label="Value" value={get(dnaDecoded, "size")} />
        </div>
      ),
    },
    {
      title: "Gem Yield",
      description: (
        <div>
          <RowStat
            label={
              <>
                Max GEM Yield&nbsp;
                <button
                  data-tip={
                    '<p class="text-left pb-2">Streamed linearly over 30 days.</p><p class="text-left pb-2">Max GEM Yield is available when traits match with the Bank\'s requirements.</p><p class="text-left pb-2">Claiming the boost without a match will result in a 50% reduction of GEM Yield.'
                  }
                >
                  <FontAwesomeIcon icon={faInfoCircle} />
                </button>
              </>
            }
            value={maxGemYield}
          />
          <RowStat
            label={
              <>
                Max ROI / Max APR&nbsp;
                <button data-tip='<p class="text-left pb-2">Assumes that the Pearl is exchanged for max GEM yield.</p><p class="text-left pb-2">APR shows annualised returns where the Pearl is exchanged for max GEM yield as soon as it next becomes available.'>
                  <FontAwesomeIcon icon={faInfoCircle} />
                </button>
              </>
            }
            value={maxAprRoiField}
          />
          <RowStat
            label={
              <>
                Max yield available in&nbsp;
                <button data-tip="Shows the time until this Pearl can next be exchanged for max GEM yield">
                  <FontAwesomeIcon icon={faInfoCircle} />
                </button>
              </>
            }
            value={formatMsToDuration(maxBoostIn)}
          />
        </div>
      ),
    },
  ];
  return (
    <>
      <ReactTooltip html={true} className="max-w-xl" />
      <div className="flex flex-col justify-between">
        <div className="flex justify-between flex-col sm:flex-row">
          <Pearl3DView width={400} height={400} pearlDna={dna} decodedDna={dnaDecoded} />
          <div className="w-full md:w-1/2 px-4 md:px-6 h-canvas">
            <Accordion data={accordionData} />
          </div>
        </div>

        <div className="flex justify-between mt-4 pt-4 space-x-14 border-t">
          <Link to="/bank">
            <button className="px-4 p-3 rounded-xl shadown-xl bg-blue-500 text-white hover:bg-blue-300 font-semibold">
              Boost yield&nbsp;
              <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-1" />
            </button>
          </Link>

          <Link to="/farms">
            <button className="px-4 p-3 rounded-xl shadown-xl bg-green-500 text-white hover:bg-green-300 font-semibold">
              Produce more pearls&nbsp;
              <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-1" />
            </button>
          </Link>
        </div>

        <Controls3DView onClickNext={onClickNext} onClickPrev={onClickPrev} />
      </div>
    </>
  );
};
