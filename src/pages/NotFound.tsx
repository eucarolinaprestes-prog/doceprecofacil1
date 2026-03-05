import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
    <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
    <p className="text-lg text-muted-foreground mb-6">Página não encontrada</p>
    <Link to="/"><Button className="rounded-xl">Voltar ao início</Button></Link>
  </div>
);

export default NotFound;
