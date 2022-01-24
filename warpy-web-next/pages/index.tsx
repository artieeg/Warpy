import React, { useEffect, useRef, useState } from "react";
import { TextButton } from "@warpy/components";
import tinycolor from "tinycolor2";

const content = [
  "miraclous moments",
  "new friendships",
  "fun memories",
  "new ideas",
  "unexpected encounters",
  "bright insights",
];

const interests = ["talent shows", "adventures", "debates", "pets", "random"];

export default function Index() {
  const fadingText = useRef<HTMLDivElement>();

  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(false);

  const flick = React.useCallback(() => {
    setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setVisible(true);
        setCurrent((prev) => prev + 1);

        flick();
      }, 1000);
    }, 1500);
  }, []);

  useEffect(() => {
    flick();
  }, []);

  const renderInterests = React.useCallback(() => {
    return interests.map((interest, idx) => (
      <span
        style={{
          color: tinycolor("#BDF971")
            .spin((idx + 1) * (255 / interests.length + 30))
            .toHexString(),
        }}
        className="font-bold text-base text-blue mx-3"
      >
        {interest}
      </span>
    ));
  }, []);

  return (
    <div className="p-3 space-y-4 bg-black flex-col flex-1">
      <div>
        <div className="font-extrabold text-lg text-yellow">warpy</div>
        <div className="font-extrabold text-xxs text-boulder">
          live social voice & video
        </div>
      </div>

      <div>
        <div className="font-bold text-xs text-green">
          <span className="text-yellow">warpy’s</span> is here to create
          <div
            ref={fadingText}
            className={`text-yellow transition-opacity duration-1000 ${
              visible ? "opacity-1" : "opacity-0"
            }`}
          >
            {content[current % content.length]}
          </div>
          <div>between people interested in...</div>
        </div>
      </div>

      <div className="-mx-3 relative flex overflow-x-hidden">
        <div className="animate-marquee whitespace-nowrap ">
          {renderInterests()}
        </div>

        <div className="absolute top-0 animate-marquee2 whitespace-nowrap">
          {renderInterests()}
        </div>
      </div>

      <div>
        <div className="font-bold text-xs text-green">
          reserve a username now and get in first when we launch!
        </div>
      </div>

      <TextButton title="reserve a username" />
    </div>
  );
}
