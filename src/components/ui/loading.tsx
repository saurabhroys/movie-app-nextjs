import React from 'react';

type LoadingProps = React.HTMLProps<HTMLDivElement>;
const Loading = React.forwardRef<HTMLDivElement, LoadingProps>((props, ref) => {
  return (
    <div id="b-loading" className="b-loading" ref={ref}>
      <div></div>
      <div></div>
    </div>
  );
});
Loading.displayName = 'Loading';

export default Loading;
