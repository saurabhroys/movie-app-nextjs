'use client';

import * as React from 'react';

const TOOLTIP_ID = '__attr_tooltip__';
const OFFSET_Y = 8; // px above the element

function ensureTooltipEl(): HTMLDivElement | null {
  if (typeof document === 'undefined') return null;
  
  let el = document.getElementById(TOOLTIP_ID) as HTMLDivElement | null;
  if (!el) {
    const docEl = document.documentElement;
    const bodyEl = document.body;
    
    // Ensure we have a valid parent to append to
    if (!docEl && !bodyEl) return null;
    
    el = document.createElement('div');
    el.id = TOOLTIP_ID;
    el.style.position = 'fixed';
    el.style.top = '0px';
    el.style.left = '0px';
    el.style.transform = 'translate(-9999px, -9999px)';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '9999999999';
    el.style.willChange = 'transform';
    el.style.background = 'rgba(0,0,0,0.85)';
    el.style.color = '#fff';
    el.style.fontSize = '12px';
    el.style.lineHeight = '1';
    el.style.padding = '6px 8px';
    el.style.borderRadius = '6px';
    el.style.whiteSpace = 'nowrap';
    el.style.boxShadow = '0 6px 24px rgba(0,0,0,0.35)';
    el.setAttribute('role', 'tooltip');
    // Append to the top-most root to avoid body-level clipping/stacking quirks
    const parent = docEl || bodyEl;
    if (parent) {
      parent.appendChild(el);
    }
  }
  return el;
}

function getAttrText(target: Element | null): string | null {
  if (!target) return null;
  return target.getAttribute('data-tooltip');
}

function findTooltipAnchor(start: Element | null): Element | null {
  if (!start) return null;
  return start.closest('[data-tooltip]');
}

function positionTooltip(el: HTMLElement, anchor: Element) {
  const rect = anchor.getBoundingClientRect();
  const tooltipRect = el.getBoundingClientRect();
  const x = Math.round(rect.left + rect.width / 2 - tooltipRect.width / 2);
  const y = Math.round(rect.top - tooltipRect.height - OFFSET_Y);

  // Keep within viewport horizontally
  const maxX = Math.max(
    8,
    Math.min(x, window.innerWidth - tooltipRect.width - 8),
  );
  const maxY = Math.max(8, y);

  el.style.transform = `translate(${maxX}px, ${maxY}px)`;
}

const AttributeTooltipManager = () => {
  React.useEffect(() => {
    // Ensure we're in the browser and document is available
    if (typeof document === 'undefined' || !document.documentElement) {
      return;
    }
    
    // Mark root as active to disable CSS tooltips
    document.documentElement.classList.add('attr-tooltip-active');
    const tooltipEl = ensureTooltipEl();
    
    // If tooltip element creation failed, exit early
    if (!tooltipEl) {
      return;
    }
    
    let currentAnchor: Element | null = null;
    let raf: number | null = null;

    const hide = () => {
      tooltipEl.style.transform = 'translate(-9999px, -9999px)';
      tooltipEl.textContent = '';
      // Restore native title and clean ARIA linkage
      if (currentAnchor) {
        // Check if element is still in the DOM
        if (currentAnchor.isConnected && currentAnchor instanceof HTMLElement) {
          const anchorEl = currentAnchor;
          const savedTitle = anchorEl.getAttribute('data-original-title');
          if (savedTitle) {
            anchorEl.setAttribute('title', savedTitle);
            anchorEl.removeAttribute('data-original-title');
          }
          if (anchorEl.getAttribute('aria-describedby') === TOOLTIP_ID) {
            anchorEl.removeAttribute('aria-describedby');
          }
        }
      }
      currentAnchor = null;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    };

    const update = () => {
      if (currentAnchor && currentAnchor.isConnected) {
        positionTooltip(tooltipEl, currentAnchor);
        raf = requestAnimationFrame(update);
      } else {
        // Element was removed from DOM, hide tooltip
        hide();
      }
    };

    const onPointerEnter = (e: Event) => {
      const rawTarget = e.target as Element | null;
      const target = findTooltipAnchor(rawTarget);
      if (!target) return;
      // Ensure target is an HTMLElement and still connected to DOM
      if (!(target instanceof HTMLElement) || !target.isConnected) return;
      const text = getAttrText(target);
      if (!text) return;
      currentAnchor = target;
      const anchorEl = target;
      
      // Double-check element is still valid before modifying attributes
      if (!anchorEl || !anchorEl.isConnected || !(anchorEl instanceof HTMLElement)) return;
      
      // Suppress native title tooltips while our tooltip is visible
      const title = anchorEl.getAttribute('title');
      if (title) {
        anchorEl.setAttribute('data-original-title', title);
        anchorEl.removeAttribute('title');
      }
      // Link via ARIA to avoid screen reader duplication
      anchorEl.setAttribute('aria-describedby', TOOLTIP_ID);
      tooltipEl.textContent = text;
      // Pre-measure by placing text then positioning
      positionTooltip(tooltipEl, target);
      if (!raf) raf = requestAnimationFrame(update);
    };

    const onPointerLeave = (e: Event) => {
      if (!currentAnchor || !currentAnchor.isConnected) {
        hide();
        return;
      }
      const target = e.target as Element | null;
      const anchor = findTooltipAnchor(target);
      // If moving to an element still inside the current anchor, do nothing
      const related = (e as MouseEvent).relatedTarget as Node | null;
      if (related && currentAnchor.contains(related)) return;
      if (anchor === currentAnchor) hide();
    };

    const onScrollOrResize = () => {
      if (currentAnchor && currentAnchor.isConnected) {
        positionTooltip(tooltipEl, currentAnchor);
      }
    };

    document.addEventListener('mouseover', onPointerEnter, true);
    document.addEventListener('focusin', onPointerEnter, true);
    document.addEventListener('mouseout', onPointerLeave, true);
    document.addEventListener('focusout', onPointerLeave, true);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize, true);

    return () => {
      document.removeEventListener('mouseover', onPointerEnter, true);
      document.removeEventListener('focusin', onPointerEnter, true);
      document.removeEventListener('mouseout', onPointerLeave, true);
      document.removeEventListener('focusout', onPointerLeave, true);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize, true);
      if (document.documentElement) {
        document.documentElement.classList.remove('attr-tooltip-active');
      }
    };
  }, []);

  return null;
};

export default AttributeTooltipManager;
