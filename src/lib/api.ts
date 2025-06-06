import axios from "axios";

import { env } from "@/env";

const api = axios.create({ baseURL: env.DATABASE_URL });

export { api };
