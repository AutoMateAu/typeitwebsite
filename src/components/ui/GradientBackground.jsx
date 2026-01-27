import { GradFlow } from 'gradflow'

export const GradientBackground = ({ children }) => {
  return (
    <div className="gradient-container">
      <GradFlow config={{
        color1: { r: 59, g: 130, b: 246 },
        color2: { r: 147, g: 197, b: 253 },
        color3: { r: 235, g: 240, b: 250 },
        speed: 0.15,
        scale: 1,
        type: 'stripe',
        noise: 0.08
      }} />
      {children}
    </div>
  );
};

export default GradientBackground;
