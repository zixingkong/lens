import "./sidebar.scss";

import React from "react";
import type { TabLayoutRoute } from "./tab-layout";
import { observer } from "mobx-react";
import { NavLink } from "react-router-dom";
import { Trans } from "@lingui/macro";
import { cssNames } from "../../utils";
import { Icon } from "../icon";
import { workloadsRoute, workloadsURL } from "../+workloads/workloads.route";
import { namespacesRoute, namespacesURL } from "../+namespaces/namespaces.route";
import { nodesRoute, nodesURL } from "../+nodes/nodes.route";
import { usersManagementRoute, usersManagementURL } from "../+user-management/user-management.route";
import { networkRoute, networkURL } from "../+network/network.route";
import { storageRoute, storageURL } from "../+storage/storage.route";
import { clusterRoute, clusterURL } from "../+cluster";
import { Config, configRoute, configURL } from "../+config";
import { eventRoute, eventsURL } from "../+events";
import { Apps, appsRoute, appsURL } from "../+apps";
import { namespaceStore } from "../+namespaces/namespace.store";
import { Workloads } from "../+workloads";
import { UserManagement } from "../+user-management";
import { Storage } from "../+storage";
import { Network } from "../+network";
import { crdStore } from "../+custom-resources/crd.store";
import { CrdList, crdResourcesRoute, crdRoute, crdURL } from "../+custom-resources";
import { CustomResources } from "../+custom-resources/custom-resources";
import { isActiveRoute } from "../../navigation";
import { isAllowedResource } from "../../../common/rbac";
import { Spinner } from "../spinner";
import { ClusterPageMenuRegistration, clusterPageMenuRegistry, clusterPageRegistry, getExtensionPageUrl } from "../../../extensions/registries";
import { SidebarNavItem } from "./sidebar-nav-item";
import { SidebarContext } from "./sidebar-context";

interface Props {
  className?: string;
  isPinned: boolean;
  toggle(): void;
}

@observer
export class Sidebar extends React.Component<Props> {
  async componentDidMount() {
    if (!crdStore.isLoaded && isAllowedResource("customresourcedefinitions")) {
      crdStore.loadAll();
    }
  }

  renderCustomResources() {
    if (crdStore.isLoading) {
      return <Spinner centerHorizontal/>;
    }

    return Object.entries(crdStore.groups).map(([group, crds]) => {
      const submenus: TabLayoutRoute[] = crds.map((crd) => {
        return {
          title: crd.getResourceKind(),
          component: CrdList,
          url: crd.getResourceUrl(),
          routePath: String(crdResourcesRoute.path),
        };
      });

      return (
        <SidebarNavItem
          key={group}
          id={`crd-${group}`}
          className="sub-menu-parent"
          url={crdURL({ query: { groups: group } })}
          subMenus={submenus}
          text={group}
        />
      );
    });
  }

  getTabLayoutRoutes(menu: ClusterPageMenuRegistration): TabLayoutRoute[] {
    if (!menu.id) {
      return [];
    }
    const routes: TabLayoutRoute[] = [];

    clusterPageMenuRegistry.getSubItems(menu).forEach((subItem) => {
      const subPage = clusterPageRegistry.getByPageMenuTarget(subItem.target);

      if (subPage) {
        routes.push({
          routePath: subPage.routePath,
          url: getExtensionPageUrl({ extensionId: subPage.extensionId, pageId: subPage.id, params: subItem.target.params }),
          title: subItem.title,
          component: subPage.components.Page,
          exact: subPage.exact
        });
      }
    });

    return routes;
  }

  renderRegisteredMenus() {
    return clusterPageMenuRegistry.getRootItems().map((menuItem, index) => {
      const registeredPage = clusterPageRegistry.getByPageMenuTarget(menuItem.target);
      const tabRoutes = this.getTabLayoutRoutes(menuItem);
      const id = `registered-item-${index}`;
      let pageUrl: string;
      let isActive = false;

      if (registeredPage) {
        const { extensionId, id: pageId } = registeredPage;

        pageUrl = getExtensionPageUrl({ extensionId, pageId, params: menuItem.target.params });
        isActive = isActiveRoute(registeredPage.routePath);
      } else if (tabRoutes.length > 0) {
        pageUrl = tabRoutes[0].url;
        isActive = isActiveRoute(tabRoutes.map((tab) => tab.routePath));
      } else {
        return;
      }

      return (
        <SidebarNavItem
          key={id}
          id={id}
          url={pageUrl}
          text={menuItem.title}
          icon={<menuItem.components.Icon/>}
          isActive={isActive}
          subMenus={tabRoutes}
        />
      );
    });
  }

  render() {
    const { toggle, isPinned, className } = this.props;
    const query = namespaceStore.getContextParams();

    return (
      <SidebarContext.Provider value={{ pinned: isPinned }}>
        <div className={cssNames("Sidebar flex column", className, { pinned: isPinned })}>
          <div className="header flex align-center">
            <NavLink exact to="/" className="box grow">
              <Icon svg="logo-lens" className="logo-icon"/>
              <div className="logo-text">Lens</div>
            </NavLink>
            <Icon
              className="pin-icon"
              tooltip={<Trans>Compact view</Trans>}
              material={isPinned ? "keyboard_arrow_left" : "keyboard_arrow_right"}
              onClick={toggle}
              focusable={false}
            />
          </div>
          <div className="sidebar-nav flex column box grow-fixed">
            <SidebarNavItem
              id="cluster"
              isActive={isActiveRoute(clusterRoute)}
              isHidden={!isAllowedResource("nodes")}
              url={clusterURL()}
              text={<Trans>Cluster</Trans>}
              icon={<Icon svg="kube"/>}
            />
            <SidebarNavItem
              id="nodes"
              isActive={isActiveRoute(nodesRoute)}
              isHidden={!isAllowedResource("nodes")}
              url={nodesURL()}
              text={<Trans>Nodes</Trans>}
              icon={<Icon svg="nodes"/>}
            />
            <SidebarNavItem
              id="workloads"
              isActive={isActiveRoute(workloadsRoute)}
              isHidden={Workloads.tabRoutes.length == 0}
              url={workloadsURL({ query })}
              subMenus={Workloads.tabRoutes}
              text={<Trans>Workloads</Trans>}
              icon={<Icon svg="workloads"/>}
            />
            <SidebarNavItem
              id="config"
              isActive={isActiveRoute(configRoute)}
              isHidden={Config.tabRoutes.length == 0}
              url={configURL({ query })}
              subMenus={Config.tabRoutes}
              text={<Trans>Configuration</Trans>}
              icon={<Icon material="list"/>}
            />
            <SidebarNavItem
              id="networks"
              isActive={isActiveRoute(networkRoute)}
              isHidden={Network.tabRoutes.length == 0}
              url={networkURL({ query })}
              subMenus={Network.tabRoutes}
              text={<Trans>Network</Trans>}
              icon={<Icon material="device_hub"/>}
            />
            <SidebarNavItem
              id="storage"
              isActive={isActiveRoute(storageRoute)}
              isHidden={Storage.tabRoutes.length == 0}
              url={storageURL({ query })}
              subMenus={Storage.tabRoutes}
              icon={<Icon svg="storage"/>}
              text={<Trans>Storage</Trans>}
            />
            <SidebarNavItem
              id="namespaces"
              isActive={isActiveRoute(namespacesRoute)}
              isHidden={!isAllowedResource("namespaces")}
              url={namespacesURL()}
              icon={<Icon material="layers"/>}
              text={<Trans>Namespaces</Trans>}
            />
            <SidebarNavItem
              id="events"
              isActive={isActiveRoute(eventRoute)}
              isHidden={!isAllowedResource("events")}
              url={eventsURL({ query })}
              icon={<Icon material="access_time"/>}
              text={<Trans>Events</Trans>}
            />
            <SidebarNavItem
              id="apps"
              isActive={isActiveRoute(appsRoute)}
              url={appsURL({ query })}
              subMenus={Apps.tabRoutes}
              icon={<Icon material="apps"/>}
              text={<Trans>Apps</Trans>}
            />
            <SidebarNavItem
              id="users"
              isActive={isActiveRoute(usersManagementRoute)}
              url={usersManagementURL({ query })}
              subMenus={UserManagement.tabRoutes}
              icon={<Icon material="security"/>}
              text={<Trans>Access Control</Trans>}
            />
            <SidebarNavItem
              id="custom-resources"
              isActive={isActiveRoute(crdRoute)}
              isHidden={!isAllowedResource("customresourcedefinitions")}
              url={crdURL()}
              subMenus={CustomResources.tabRoutes}
              icon={<Icon material="extension"/>}
              text={<Trans>Custom Resources</Trans>}
            >
              {this.renderCustomResources()}
            </SidebarNavItem>
            {this.renderRegisteredMenus()}
          </div>
        </div>
      </SidebarContext.Provider>
    );
  }
}
