import {
  createWebHashHistory,
  createRouter
} from "vue-router";
import Affix from '../components/affix';
import Input from '../components/input';
import Icon from '../components/icon';
import Button from '../components/button';
import Elevation from '../components/elevation';
import Layout from '../components/layout';
import List from '../components/list';
import Carousel from '../components/carousel';
import Switch from '../components/switch';
import BottomNav from '../components/bottom-nav';
import Breadcrumb from '../components/breadcrumb';
import Select from '../components/select';
import Steps from '../components/steps';
import UpLoad from '../components/upLoad';
import Progress from '../components/progress';
import Circle from '../components/circle';

const routes = [{
    path: "/Affix",
    name: "Affix",
    component: Affix,
  },
  {
    path: "/Input",
    name: "Input",
    component: Input,
  },
  {
    path: "/Icon",
    name: "Icon",
    component: Icon,
  },
  {
    path: "/Button",
    name: "Button",
    component: Button,
  },
  {
    path: "/Elevation",
    name: "Elevation",
    component: Elevation,
  },
  {
    path: "/Layout",
    name: "Layout",
    component: Layout,
  },
  {
    path: "/List",
    name: "List",
    component: List,
  },
  {
    path: "/Carousel",
    name: "Carousel",
    component: Carousel,
  },
  {
    path: "/Switch",
    name: "Switch",
    component: Switch,
  },
  {
    path: "/bottom-nav",
    name: "BottomNav",
    component: BottomNav,
  },
  {
    path: "/breadcrumb",
    name: "Breadcrumb",
    component: Breadcrumb,
  },
  {
    path: "/select",
    name: "Select",
    component: Select,
  },
  {
    path: "/steps",
    name: "Steps",
    component: Steps,
  },
  {
    path: "/upLoad",
    name: "UpLoad",
    component: UpLoad,
  },
  {
    path: "/progress",
    name: "Progress",
    component: Progress,
  },
  {
    path: "/circle",
    name: "Circle",
    component: Circle,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
